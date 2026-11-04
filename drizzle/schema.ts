import { sql } from "drizzle-orm";
import { integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

// Postgres enums (Supabase). Names are global per database — keep them stable.
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const productStatusEnum = pgEnum("product_status", ["In stock", "Low stock", "Out of stock"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Storefront customers (password or Supabase OAuth sign up). Separate from Manus OAuth
 * users above. Sessions live in a long-lived httpOnly cookie so customers
 * stay logged in across refresh / window close until they log out.
 */
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  supabaseUserId: varchar("supabaseUserId", { length: 128 }).unique(),
  phone: varchar("phone", { length: 32 }),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("customers_email_lower_unique").on(sql`lower(${table.email})`),
]);

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Customer orders. Items are snapshotted as JSON at purchase time so later
 * product edits don't rewrite history. Status is a plain varchar to keep
 * forward-compatible without enum migrations.
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customerId").notNull(),
  items: text("items").notNull(), // JSON: [{productId,name,brand,size,price,quantity,image}]
  subtotal: integer("subtotal").notNull(),
  delivery: integer("delivery").notNull().default(0),
  total: integer("total").notNull(),
  status: varchar("status", { length: 32 }).default("Pending").notNull(),
  zone: varchar("zone", { length: 16 }).default("inside").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 16 }).default("cod").notNull(),
  paymentStatus: varchar("paymentStatus", { length: 24 }).default("unpaid").notNull(),
  paymentProvider: varchar("paymentProvider", { length: 32 }),
  paymentReference: varchar("paymentReference", { length: 128 }),
  paymentUpdatedAt: timestamp("paymentUpdatedAt"),
  paidAmount: integer("paidAmount").default(0).notNull(),
  senderNumber: varchar("senderNumber", { length: 32 }),
  trxId: varchar("trxId", { length: 64 }),
  couponCode: varchar("couponCode", { length: 32 }),
  discount: integer("discount").default(0).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  provider: varchar("provider", { length: 32 }).notNull(),
  providerPaymentId: varchar("providerPaymentId", { length: 128 }).unique(),
  providerTransactionId: varchar("providerTransactionId", { length: 128 }),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("BDT").notNull(),
  status: varchar("status", { length: 24 }).default("initiated").notNull(),
  rawPayload: text("rawPayload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 16 }).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

export const inventoryEvents = pgTable("inventory_events", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull(),
  size: varchar("size", { length: 32 }),
  quantity: integer("quantity").notNull(),
  kind: varchar("kind", { length: 24 }).notNull(),
  orderId: integer("orderId"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryEvent = typeof inventoryEvents.$inferSelect;
export type InsertInventoryEvent = typeof inventoryEvents.$inferInsert;

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  event: varchar("event", { length: 32 }).notNull(),
  path: varchar("path", { length: 512 }).notNull(),
  sessionId: varchar("sessionId", { length: 64 }),
  referrer: varchar("referrer", { length: 512 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Discount coupons. `type` is "percent" (0–100) or "flat" (taka).
 * `minSubtotal` is the minimum bag subtotal in taka. `expiresAt` null = no expiry.
 */
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  type: varchar("type", { length: 16 }).default("percent").notNull(),
  value: integer("value").notNull(),
  minSubtotal: integer("minSubtotal").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  active: varchar("active", { length: 8 }).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

/**
 * Store settings as key/value rows (announcement, merchant number, ...).
 * Missing keys fall back to built-in defaults in code.
 */
export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type StoreSetting = typeof storeSettings.$inferSelect;
export type InsertStoreSetting = typeof storeSettings.$inferInsert;

export type OrderItem = {
  productId: string;
  name: string;
  brand?: string;
  size: string;
  price: number;
  quantity: number;
  image?: string;
  premium?: string; // premium bottle option label, if chosen
};

export const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  family: text("family").notNull(),
  notes: text("notes").notNull(),
  price: integer("price").notNull(), // Base / "from" price in Taka (smallest size)
  sizes: text("sizes").notNull(), // JSON array string, e.g. ["10ml","30ml"]
  sizePrices: text("sizePrices"), // Optional JSON object mapping size -> price, e.g. {"10ml":490,"30ml":1290}
  sizeStocks: text("sizeStocks"), // Optional JSON object mapping size -> stock qty, e.g. {"10ml":5,"30ml":0}
  audience: varchar("audience", { length: 16 }).default("Unisex").notNull(), // Men | Women | Unisex
  vibe: text("vibe"), // e.g. Fresh, Warm, Bold — set by admin, used as filter
  type: text("type"), // e.g. EDP, EDT, Parfum, Attar — set by admin, used as filter
  premiumName: text("premiumName"), // Optional premium bottle option label, e.g. "Crystal flacon"
  premiumPrice: integer("premiumPrice"), // Extra price for the premium bottle option
  premiumStock: integer("premiumStock").default(0).notNull(),
  image: text("image").notNull(),
  badge: text("badge"),
  tone: text("tone").notNull(),
  stock: integer("stock").default(0).notNull(),
  status: productStatusEnum("status").default("In stock").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
