import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminSessionProcedure, analyticsThrottle, contactThrottle, couponThrottle, loginRateLimit, orderThrottle, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "./_core/notification";
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
import { checkCoupon, checkDatabase, createAnalyticsEvent, createContact, createCoupon, createOrderWithInventory, createPayment, deleteCoupon, getAnalyticsSummary, getStoreSettings, listContacts, listCoupons, listOrders, listOrdersByCustomer, parseOrderItems, setStoreSetting, updateContactStatus, updateCoupon, updateOrderPayment, updateOrderStatus } from "./db";
import { deliveryFeeFor } from "../shared/order";
import { ORDER_STATUSES } from "../drizzle/schema";
import { uploadProductImage } from "./supabaseStorage";
import { listProducts, createProduct, deleteProduct, updateProduct } from "./db";
import { createBkashPayment, isBkashConfigured } from "./bkash";

// ---------------------------------------------------------------------------
// Order pricing integrity.
//
// The client sends its cart view (price, name, image), but none of it is
// trusted: every line is rebuilt from the catalogue so a tampered payload
// cannot charge less, rename a product or swap an image. Unknown products or
// sizes (stale carts) are rejected with a clear message instead of silently
// computing a wrong total.
// ---------------------------------------------------------------------------

function parseJsonArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // fall through
    }
  }
  return [];
}

function parsePriceRecord(raw: unknown): Record<string, number> {
  const source =
    typeof raw === "string"
      ? (() => {
          try {
            return JSON.parse(raw) as unknown;
          } catch {
            return null;
          }
        })()
      : raw;
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};
  const out: Record<string, number> = {};
  for (const [size, value] of Object.entries(source as Record<string, unknown>)) {
    const n = Number(value);
    if (size && Number.isFinite(n) && n >= 0) out[size] = n;
  }
  return out;
}

function parseStockRecord(raw: unknown): Record<string, number> {
  return parsePriceRecord(raw);
}

export type OrderLineInput = { productId: string; size: string; quantity: number; premium?: string };

/** Rebuilds cart lines with catalogue prices/names/images. Throws TRPCError BAD_REQUEST on unknown product/size. */
export async function resolveOrderItems(items: OrderLineInput[]) {
  const catalogue = await listProducts();
  const byId = new Map(catalogue.map(p => [String(p.id), p]));
  const requestedBySize = new Map<string, number>();
  const requestedPremium = new Map<string, number>();
  return items.map(item => {
    const product = byId.get(item.productId);
    if (!product) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Your bag contains an item that is no longer available. Please refresh and try again.",
      });
    }
    if (!parseJsonArray(product.sizes).includes(item.size)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `"${product.name}" does not come in ${item.size}. Please refresh your bag and try again.`,
      });
    }
    if (product.status === "Out of stock") {
      throw new TRPCError({ code: "BAD_REQUEST", message: `"${product.name}" is currently out of stock.` });
    }
    const sizeKey = `${item.productId}:${item.size}`;
    const requestedSize = (requestedBySize.get(sizeKey) ?? 0) + item.quantity;
    requestedBySize.set(sizeKey, requestedSize);
    const stockRecord = parseStockRecord(product.sizeStocks);
    const available = stockRecord[item.size] ?? (Object.keys(stockRecord).length === 0 ? product.stock : 0);
    if (requestedSize > available) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Only ${available} of "${product.name}" (${item.size}) are available.`,
      });
    }
    const sizePrices = parsePriceRecord(product.sizePrices);
    const base = sizePrices[item.size] ?? product.price;
    let unitPrice = base;
    if (item.premium) {
      if (!product.premiumName || !product.premiumPrice || product.premiumPrice <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `The premium option is not available for "${product.name}".`,
        });
      }
      const premiumKey = `${item.productId}:${product.premiumName}`;
      const requestedPremiumCount = (requestedPremium.get(premiumKey) ?? 0) + item.quantity;
      requestedPremium.set(premiumKey, requestedPremiumCount);
      if (requestedPremiumCount > (product.premiumStock ?? 0)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Only ${product.premiumStock ?? 0} premium options are available for "${product.name}".`,
        });
      }
      unitPrice += product.premiumPrice;
    }
    return {
      productId: item.productId,
      name: product.name,
      brand: product.brand,
      size: item.size,
      price: unitPrice,
      quantity: item.quantity,
      image: product.image,
      ...(item.premium ? { premium: product.premiumName ?? item.premium } : {}),
    };
  });
}

export const appRouter = router({
  system: systemRouter,
  products: router({
    list: publicProcedure.query(() => listProducts()),
    create: adminSessionProcedure
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
      .mutation(async ({ input }) => {
        await createProduct(input);
        return { success: true };
      }),
    delete: adminSessionProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProduct(input.id);
        return { success: true };
      }),
    uploadImage: adminSessionProcedure
      .input(z.object({
        filename: z.string().min(1).max(120),
        contentType: z.string().min(1).max(60),
        // Base64-encoded file bytes (data URL prefix not included). ~5MB max file.
        dataBase64: z.string().min(1).max(8_000_000),
      }))
      .mutation(async ({ input }) => {
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
    update: adminSessionProcedure
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
      .mutation(async ({ input }) => {
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
    login: publicProcedure.use(loginRateLimit).input(z.object({ id: z.string().min(1), password: z.string().min(1) })).mutation(({ input, ctx }) => {
      if (!validateAdminCredentials(input.id, input.password)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin credentials" });
      }
      issueAdminSession(ctx.res, ctx.req);
      return { success: true, role: "super_admin" as const };
    }),
    me: publicProcedure.query(({ ctx }) => {
      const authenticated = isAdminAuthenticated(ctx.req);
      return { authenticated, role: authenticated ? ("super_admin" as const) : null };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      clearAdminSession(ctx.res, ctx.req);
      return { success: true } as const;
    }),
    orders: adminSessionProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100), offset: z.number().int().min(0).default(0) }).optional())
      .query(async ({ input }) => {
      const limit = input?.limit ?? 100;
      const offset = input?.offset ?? 0;
      const [all, allCustomers] = await Promise.all([listOrders(), listCustomers()]);
      const byId = new Map(allCustomers.map((c) => [c.id, c]));
      const page = all.slice(offset, offset + limit);
      return page.map((o) => ({
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
        paymentStatus: o.paymentStatus,
        paymentProvider: o.paymentProvider,
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
    updateOrderStatus: adminSessionProcedure
      .input(z.object({ id: z.number(), status: z.enum(ORDER_STATUSES) }))
      .mutation(async ({ input }) => {
        await updateOrderStatus(input.id, input.status);
        return { success: true };
      }),
    analytics: adminSessionProcedure.query(() => getAnalyticsSummary()),
    contacts: router({
      list: adminSessionProcedure.query(() => listContacts()),
      updateStatus: adminSessionProcedure
        .input(z.object({ id: z.number(), status: z.enum(["new", "notified", "read", "resolved"]) }))
        .mutation(async ({ input }) => {
          await updateContactStatus(input.id, input.status);
          return { success: true };
        }),
    }),
    coupons: router({
      list: adminSessionProcedure.query(async () => listCoupons()),
      create: adminSessionProcedure
        .input(z.object({
          code: z.string().trim().min(1).max(32),
          type: z.enum(["percent", "flat"]),
          value: z.number().int().min(1),
          minSubtotal: z.number().int().min(0).default(0),
          expiresAt: z.string().max(32).optional(),
          active: z.enum(["yes", "no"]).default("yes"),
        }))
        .mutation(async ({ input }) => {
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
      update: adminSessionProcedure
        .input(z.object({
          id: z.number(),
          active: z.enum(["yes", "no"]).optional(),
          expiresAt: z.string().max(32).nullable().optional(),
          value: z.number().int().min(1).max(100000).optional(),
          minSubtotal: z.number().int().min(0).optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...patch } = input;
          if (
            patch.value !== undefined &&
            (await listCoupons()).find(c => c.id === id)?.type ===
              "percent" &&
            patch.value > 100
          ) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Percent discount cannot exceed 100." });
          }
          await updateCoupon(id, {
            ...(patch.active !== undefined ? { active: patch.active } : {}),
            ...(patch.expiresAt !== undefined ? { expiresAt: patch.expiresAt ? new Date(patch.expiresAt) : null } : {}),
            ...(patch.value !== undefined ? { value: patch.value } : {}),
            ...(patch.minSubtotal !== undefined ? { minSubtotal: patch.minSubtotal } : {}),
          });
          return { success: true };
        }),
      remove: adminSessionProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await deleteCoupon(input.id);
          return { success: true };
        }),
    }),
    settings: router({
      get: adminSessionProcedure.query(() => getStoreSettings()),
      dbStatus: adminSessionProcedure.query(async () => {
        const result = await checkDatabase();
        return {
          connected: result.ok,
          mode: result.ok ? ("supabase" as const) : ("in-memory" as const),
          message: result.ok
            ? "Connected — the panel shows live Supabase data."
            : (result.error ?? "Database unreachable."),
        };
      }),
      save: adminSessionProcedure
        .input(z.object({
          announcement: z.string().trim().max(300),
          merchantNumber: z.string().trim().min(1).max(32),
          supportEmail: z.string().trim().email("Enter a valid email address").max(320),
          supportPhone: z.string().trim().max(32),
          freeThreshold: z.number().int().min(0),
        }))
        .mutation(async ({ input }) => {
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
      .use(loginRateLimit)
      .input(z.object({
        name: z.string().trim().min(1, "Name is required").max(120),
        email: z.string().trim().toLowerCase().email("Enter a valid email address"),
        password: z.string().min(8, "Password must be at least 8 characters").max(100),
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
      .use(loginRateLimit)
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
      .use(couponThrottle)
      .input(z.object({
        code: z.string().trim().min(1).max(32),
        subtotal: z.number().int().min(0),
      }))
      .query(async ({ input }) => checkCoupon(input.code, input.subtotal)),
  }),
  settings: router({
    public: publicProcedure.query(() => getStoreSettings()),
  }),
  contact: router({
    submit: publicProcedure
      .use(contactThrottle)
      .input(z.object({
        name: z.string().trim().min(1, "Name is required").max(120),
        email: z.string().trim().toLowerCase().email("Enter a valid email address").max(320),
        message: z.string().trim().min(1, "Message is required").max(4000),
      }))
      .mutation(async ({ input }) => {
        const row = await createContact(input);
        try {
          const delivered = await notifyOwner({
            title: `New contact message from ${input.name}`,
            content: `Email: ${input.email}\n\n${input.message}`,
          });
          if (delivered) await updateContactStatus(row.id, "notified");
        } catch (error) {
          console.warn("[Contact] Message stored but owner notification failed:", error);
        }
        return { success: true, contactId: row.id } as const;
      }),
  }),
  analytics: router({
    track: publicProcedure
      .use(analyticsThrottle)
      .input(z.object({
        event: z.enum(["page_view", "product_view", "add_to_cart", "checkout_started", "order_completed", "client_error"]),
        path: z.string().trim().min(1).max(512),
        sessionId: z.string().trim().max(64).optional(),
        referrer: z.string().trim().max(512).optional(),
        metadata: z.record(z.string(), z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        await createAnalyticsEvent({
          event: input.event,
          path: input.path,
          sessionId: input.sessionId,
          referrer: input.referrer,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        });
        return { success: true } as const;
      }),
  }),
  payments: router({
    status: publicProcedure.query(() => ({ bkash: isBkashConfigured() })),
  }),
  customers: router({
    list: adminSessionProcedure.query(async () => {
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
      .use(orderThrottle)
      .input(z.object({
        items: z.array(z.object({
          productId: z.string().trim().min(1).max(64),
          name: z.string().max(120),
          brand: z.string().max(120).optional(),
          size: z.string().trim().min(1).max(32),
          price: z.number().int().min(0),
          quantity: z.number().int().min(1).max(99),
          image: z.string().max(2048).optional(),
          premium: z.string().trim().max(120).optional(),
        })).min(1, "Your bag is empty.").max(50, "Your bag has too many line items."),
        name: z.string().trim().min(1, "Name is required").max(120),
        phone: z.string().trim().min(1, "Phone is required").max(32),
        address: z.string().trim().min(1, "Address is required").max(500, "Address is too long."),
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
        // Rebuild every line from the catalogue — client prices are advisory only.
        const trustedItems = await resolveOrderItems(input.items);
        const subtotal = trustedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
        const paidAmount = 0;
        let paymentStatus = "unpaid";
        if (input.paymentMethod === "online") {
          if (!isBkashConfigured()) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Online payment is not configured yet. Please choose Cash on Delivery." });
          }
          paymentStatus = "initiated";
        }
        let order;
        try {
          order = await createOrderWithInventory({
            customerId,
            items: JSON.stringify(trustedItems),
            subtotal,
            delivery,
            total,
            status: "Pending",
            name: input.name,
            phone: input.phone,
            address: input.address,
            zone: input.zone,
            paymentMethod: input.paymentMethod,
            paymentStatus,
            paymentProvider: input.paymentMethod === "online" ? "bkash" : null,
            paymentReference: null,
            paidAmount,
            senderNumber: null,
            trxId: null,
            couponCode,
            discount,
          }, input.items.map(item => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity,
            premium: Boolean(item.premium),
          })));
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Inventory is no longer available." });
        }
        let paymentUrl: string | null = null;
        if (input.paymentMethod === "online") {
          try {
            const payment = await createBkashPayment({ orderId: order.id, amount: order.total, customerReference: String(customerId) });
            await createPayment({ orderId: order.id, provider: "bkash", providerPaymentId: payment.paymentId, amount: order.total, status: "initiated", rawPayload: JSON.stringify(payment.raw) });
            await updateOrderPayment(order.id, { paymentStatus: "initiated", paymentProvider: "bkash", paymentReference: payment.merchantInvoiceNumber, paidAmount: 0 });
            paymentUrl = payment.redirectUrl;
          } catch (error) {
            await updateOrderStatus(order.id, "Cancelled");
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error instanceof Error ? error.message : "Could not initialize online payment." });
          }
        }
        return { success: true, orderId: order.id, total: order.total, paymentUrl };
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
