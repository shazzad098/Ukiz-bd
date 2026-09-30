import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { clearAdminSession, isAdminAuthenticated, issueAdminSession, validateAdminCredentials } from "./adminAuth";
import {
  clearCustomerSession,
  getCustomerSessionId,
  hashPassword,
  issueCustomerSession,
  verifyPassword,
} from "./customerAuth";
import { z } from "zod";

import { createCustomer, getCustomerByEmail, getCustomerById, listCustomers, touchCustomerSignin } from "./db";
import { checkCoupon, createCoupon, createOrder, deleteCoupon, getStoreSettings, listCoupons, listOrders, listOrdersByCustomer, parseOrderItems, setStoreSetting, updateCoupon, updateOrderStatus } from "./db";
import { deliveryFeeFor } from "../shared/order";
import { ORDER_STATUSES } from "../drizzle/schema";
import { uploadProductImage } from "./supabaseStorage";
import { listProducts, createProduct, deleteProduct, updateProduct } from "./db";

export const appRouter = router({
  system: systemRouter,
  products: router({
    list: publicProcedure.query(() => listProducts()),
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        brand: z.string(),
        family: z.string(),
        notes: z.string(),
        price: z.number(),
        sizes: z.string(),
        sizePrices: z.string().optional(),
        sizeStocks: z.string().optional(),
        audience: z.enum(["Men", "Women", "Unisex"]).default("Unisex"),
        vibe: z.string().optional(),
        type: z.string().optional(),
        premiumName: z.string().optional(),
        premiumPrice: z.number().optional(),
        premiumStock: z.number().default(0),
        image: z.string(),
        badge: z.string().optional(),
        tone: z.string(),
        stock: z.number().default(0),
        status: z.enum(["In stock", "Low stock", "Out of stock"]).default("In stock"),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdminAuthenticated(ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED" });
        await createProduct(input);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdminAuthenticated(ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED" });
        await deleteProduct(input.id);
        return { success: true };
      }),
    uploadImage: publicProcedure
      .input(z.object({
        filename: z.string().min(1).max(120),
        contentType: z.string().min(1).max(60),
        // Base64-encoded file bytes (data URL prefix not included). ~5MB max file.
        dataBase64: z.string().min(1).max(8_000_000),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdminAuthenticated(ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED" });
        let data: Buffer;
        try {
          data = Buffer.from(input.dataBase64, "base64");
        } catch {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image data." });
        }
        try {
          const url = await uploadProductImage(data, input.contentType, input.filename);
          return { success: true, url };
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Upload failed." });
        }
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        brand: z.string().optional(),
        family: z.string().optional(),
        notes: z.string().optional(),
        price: z.number().optional(),
        sizes: z.string().optional(),
        sizePrices: z.string().nullable().optional(),
        sizeStocks: z.string().nullable().optional(),
        audience: z.enum(["Men", "Women", "Unisex"]).optional(),
        vibe: z.string().nullable().optional(),
        type: z.string().nullable().optional(),
        premiumName: z.string().nullable().optional(),
        premiumPrice: z.number().nullable().optional(),
        premiumStock: z.number().optional(),
        image: z.string().optional(),
        badge: z.string().nullable().optional(),
        tone: z.string().optional(),
        stock: z.number().optional(),
        status: z.enum(["In stock", "Low stock", "Out of stock"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdminAuthenticated(ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED" });
        const { id, ...patch } = input;
        await updateProduct(id, patch);
        return { success: true };
      }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions });
      return { success: true } as const;
    }),
  }),
  admin: router({
    login: publicProcedure.input(z.object({ id: z.string().min(1), password: z.string().min(1) })).mutation(({ input, ctx }) => {
      if (!validateAdminCredentials(input.id, input.password)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin credentials" });
      }
      issueAdminSession(ctx.res, ctx.req);
      return { success: true, role: "super_admin" as const };
    }),
    me: publicProcedure.query(({ ctx }) => ({ authenticated: isAdminAuthenticated(ctx.req), role: "super_admin" as const })),
    logout: publicProcedure.mutation(({ ctx }) => {
      clearAdminSession(ctx.res, ctx.req);
      return { success: true } as const;
    }),
    orders: publicProcedure.query(async ({ ctx }) => {
      if (!isAdminAuthenticated(ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED" });
      const [all, allCustomers] = await Promise.all([listOrders(), listCustomers()]);
      const byId = new Map(allCustomers.map((c) => [c.id, c]));
      return all.map((o) => ({
        id: o.id,
        customerId: o.customerId,
        customerName: byId.get(o.customerId)?.name ?? o.name,
        customerEmail: byId.get(o.customerId)?.email ?? "",
        items: parseOrderItems(o.items),
        subtotal: o.subtotal,
        delivery: o.delivery,
        total: o.total,
        status: o.status,
        zone: o.zone,
        paymentMethod: o.paymentMethod,
        paidAmount: o.paidAmount,
        senderNumber: o.senderNumber,
        trxId: o.trxId,
        couponCode: o.couponCode,
        discount: o.discount,
        name: o.name,
        phone: o.phone,
        address: o.address,
        createdAt: o.createdAt,
      }));
    }),
    updateOrderStatus: publicProcedure
      .input(z.object({ id: z.number(), status: z.enum(ORDER_STATUSES) }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdminAuthenticated(ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED" });
        await updateOrderStatus(input.id, input.status);
        return { success: true };
      }),
    coupons: router({
      list: publicProcedure.query(async ({ ctx }) => {
        if (!isAdminAuthenticated(ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED" });
        return listCoupons();
      }),
      create: publicProcedure
        .input(z.object({
          code: z.string().trim().min(1).max(32),
          type: z.enum(["percent", "flat"]),
          value: z.number().int().min(1),
          minSubtotal: z.number().int().min(0).default(0),
          expiresAt: z.string().max(32).optional(),
          active: z.enum(["yes", "no"]).default("yes"),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!isAdminAuthenticated(ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED" });
          if (input.type === "percent" && input.value > 100) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Percent discount cannot exceed 100." });
          }
          try {
            const row = await createCoupon({
              code: input.code.toUpperCase(),
              type: input.type,
              value: input.value,
              minSubtotal: input.minSubtotal,
              expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
              active: input.active,
            });
            return { success: true, id: row.id };
          } catch {
            throw new TRPCError({ code: "CONFLICT", message: "This coupon code already exists." });
          }
        }),
      update: publicProcedure
        .input(z.object({
          id: z.number(),
          active: z.enum(["yes", "no"]).optional(),
          expiresAt: z.string().max(32).nullable().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!isAdminAuthenticated(ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED" });
          const { id, ...patch } = input;
          await updateCoupon(id, {
            ...(patch.active !== undefined ? { active: patch.active } : {}),
            ...(patch.expiresAt !== undefined ? { expiresAt: patch.expiresAt ? new Date(patch.expiresAt) : null } : {}),
          });
          return { success: true };
        }),
      remove: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (!isAdminAuthenticated(ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED" });
          await deleteCoupon(input.id);
          return { success: true };
        }),
    }),
    settings: router({
      get: publicProcedure.query(async ({ ctx }) => {
        if (!isAdminAuthenticated(ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED" });
        return getStoreSettings();
      }),
      save: publicProcedure
        .input(z.object({
          announcement: z.string().trim().max(300),
          merchantNumber: z.string().trim().min(1).max(32),
          supportEmail: z.string().trim().email("Enter a valid email address").max(320),
          supportPhone: z.string().trim().max(32),
          freeThreshold: z.number().int().min(0),
        }))
        .mutation(async ({ input, ctx }) => {
          if (!isAdminAuthenticated(ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED" });
          await Promise.all([
            setStoreSetting("announcement", input.announcement),
            setStoreSetting("merchantNumber", input.merchantNumber),
            setStoreSetting("supportEmail", input.supportEmail),
            setStoreSetting("supportPhone", input.supportPhone),
            setStoreSetting("freeThreshold", String(input.freeThreshold)),
          ]);
          return { success: true };
        }),
    }),
  }),
  customer: router({
    signup: publicProcedure
      .input(z.object({
        name: z.string().trim().min(1, "Name is required").max(120),
        email: z.string().trim().toLowerCase().email("Enter a valid email address"),
        password: z.string().min(6, "Password must be at least 6 characters").max(100),
        phone: z.string().trim().max(32).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getCustomerByEmail(input.email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists. Please sign in." });
        const row = await createCustomer({
          name: input.name,
          email: input.email,
          passwordHash: hashPassword(input.password),
          phone: input.phone || null,
          lastSignedIn: new Date(),
        });
        await touchCustomerSignin(row.id);
        issueCustomerSession(ctx.res, ctx.req, row.id);
        return { success: true, customer: { id: row.id, name: row.name, email: row.email } };
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const row = await getCustomerByEmail(input.email);
        if (!row || !verifyPassword(input.password, row.passwordHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect email or password." });
        }
        await touchCustomerSignin(row.id);
        issueCustomerSession(ctx.res, ctx.req, row.id);
        return { success: true, customer: { id: row.id, name: row.name, email: row.email } };
      }),
    me: publicProcedure.query(async ({ ctx }) => {
      const id = getCustomerSessionId(ctx.req);
      if (!id) return null;
      const row = await getCustomerById(id);
      if (!row) return null;
      return { id: row.id, name: row.name, email: row.email, phone: row.phone, createdAt: row.createdAt };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      clearCustomerSession(ctx.res, ctx.req);
      return { success: true } as const;
    }),
  }),
  coupons: router({
    validate: publicProcedure
      .input(z.object({
        code: z.string().trim().min(1).max(32),
        subtotal: z.number().int().min(0),
      }))
      .query(async ({ input }) => checkCoupon(input.code, input.subtotal)),
  }),
  settings: router({
    public: publicProcedure.query(() => getStoreSettings()),
  }),
  customers: router({
    list: publicProcedure.query(async ({ ctx }) => {
      if (!isAdminAuthenticated(ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED" });
      const rows = await listCustomers();
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        createdAt: r.createdAt,
        lastSignedIn: r.lastSignedIn,
      }));
    }),
  }),
  orders: router({
    create: publicProcedure
      .input(z.object({
        items: z.array(z.object({
          productId: z.string(),
          name: z.string(),
          brand: z.string().optional(),
          size: z.string(),
          price: z.number().int().min(0),
          quantity: z.number().int().min(1).max(99),
          image: z.string().optional(),
          premium: z.string().optional(),
        })).min(1, "Your bag is empty."),
        name: z.string().trim().min(1, "Name is required").max(120),
        phone: z.string().trim().min(1, "Phone is required").max(32),
        address: z.string().trim().min(1, "Address is required"),
        zone: z.enum(["inside", "near", "outside"]),
        paymentMethod: z.enum(["cod", "online"]),
        paymentChoice: z.enum(["full", "advance"]).optional(),
        senderNumber: z.string().trim().max(32).optional(),
        trxId: z.string().trim().max(64).optional(),
        couponCode: z.string().trim().max(32).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const customerId = getCustomerSessionId(ctx.req);
        if (!customerId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in to place an order." });
        const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let discount = 0;
        let couponCode: string | null = null;
        if (input.couponCode) {
          const check = await checkCoupon(input.couponCode, subtotal);
          if (!check.valid) throw new TRPCError({ code: "BAD_REQUEST", message: check.message });
          discount = check.discount;
          couponCode = check.code;
        }
        const settings = await getStoreSettings();
        const threshold = Number(settings.freeThreshold) || 3000;
        const delivery = deliveryFeeFor(input.zone, subtotal - discount, threshold);
        const total = subtotal - discount + delivery;
        let paidAmount = 0;
        if (input.paymentMethod === "online") {
          if (!input.senderNumber || !input.trxId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Sender number and transaction ID are required for bKash / Nagad payment." });
          }
          paidAmount = input.paymentChoice === "advance" ? delivery : total;
        }
        const order = await createOrder({
          customerId,
          items: JSON.stringify(input.items),
          subtotal,
          delivery,
          total,
          status: "Pending",
          name: input.name,
          phone: input.phone,
          address: input.address,
          zone: input.zone,
          paymentMethod: input.paymentMethod,
          paidAmount,
          senderNumber: input.senderNumber ?? null,
          trxId: input.trxId ?? null,
          couponCode,
          discount,
        });
        return { success: true, orderId: order.id, total: order.total };
      }),
    mine: publicProcedure.query(async ({ ctx }) => {
      const customerId = getCustomerSessionId(ctx.req);
      if (!customerId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const rows = await listOrdersByCustomer(customerId);
      return rows.map((r) => ({ ...r, items: parseOrderItems(r.items) }));
    }),
  }),
});

export type AppRouter = typeof appRouter;

