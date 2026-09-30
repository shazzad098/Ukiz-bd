import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
// Works with Supabase: paste the pooler (port 6543) or direct (port 5432)
// connection string into DATABASE_URL. `prepare: false` keeps it compatible
// with Supabase's transaction-mode pooler.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, { prepare: false });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
import { customers, InsertCustomer, Customer } from "../drizzle/schema";
import { orders, InsertOrder, Order, OrderItem } from "../drizzle/schema";
import { products, InsertProduct, Product } from "../drizzle/schema";

const seedProducts: InsertProduct[] = [
  { name: "Santal 04", brand: "Maison Néroli", family: "Woody / Amber", notes: "Sandalwood · Cardamom · Cedar", price: 1850, sizes: JSON.stringify(["10ml", "30ml", "50ml"]), sizePrices: JSON.stringify({ "10ml": 1850, "30ml": 3200, "50ml": 4500 }), sizeStocks: JSON.stringify({ "10ml": 20, "30ml": 12, "50ml": 10 }), audience: "Unisex", vibe: "Woody", type: "EDP", premiumName: "Crystal flacon", premiumPrice: 1500, premiumStock: 5, image: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=88", badge: "Bestseller", tone: "#d7c1a0", stock: 42, status: "In stock" },
  { name: "Musc 11", brand: "Atelier N° 11", family: "Clean / Musky", notes: "White musk · Linen · Ambrette", price: 1250, sizes: JSON.stringify(["10ml", "30ml"]), sizePrices: JSON.stringify({ "10ml": 1250, "30ml": 2100 }), sizeStocks: JSON.stringify({ "10ml": 10, "30ml": 8 }), audience: "Women", vibe: "Fresh", type: "EDT", premiumName: null, premiumPrice: null, premiumStock: 0, image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=88", badge: "New", tone: "#dad7d0", stock: 18, status: "Low stock" },
  { name: "Bois Rosé", brand: "L'Objet Parfum", family: "Floral / Woody", notes: "Damask rose · Patchouli · Incense", price: 2200, sizes: JSON.stringify(["10ml", "30ml", "50ml"]), sizePrices: JSON.stringify({ "10ml": 2200, "30ml": 3900, "50ml": 5400 }), sizeStocks: JSON.stringify({ "10ml": 12, "30ml": 9, "50ml": 6 }), audience: "Women", vibe: "Floral", type: "EDP", premiumName: null, premiumPrice: null, premiumStock: 0, image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=88", badge: null, tone: "#cdb2a2", stock: 27, status: "In stock" },
  { name: "Vetiver 16", brand: "Cendre Studio", family: "Green / Earthy", notes: "Vetiver · Grapefruit · Moss", price: 1650, sizes: JSON.stringify(["10ml", "30ml"]), sizePrices: JSON.stringify({ "10ml": 1650, "30ml": 2900 }), sizeStocks: JSON.stringify({ "10ml": 4, "30ml": 2 }), audience: "Men", vibe: "Earthy", type: "EDT", premiumName: null, premiumPrice: null, premiumStock: 0, image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=900&q=88", badge: "Limited", tone: "#aeb8ab", stock: 6, status: "Low stock" },
  { name: "Ambre 09", brand: "Maison Néroli", family: "Amber / Spicy", notes: "Warm amber · Saffron · Vanilla", price: 1950, sizes: JSON.stringify(["10ml", "30ml", "50ml"]), sizePrices: JSON.stringify({ "10ml": 1950, "30ml": 3400, "50ml": 4800 }), sizeStocks: JSON.stringify({ "10ml": 14, "30ml": 10, "50ml": 6 }), audience: "Unisex", vibe: "Warm", type: "Parfum", premiumName: "Voyager case", premiumPrice: 800, premiumStock: 8, image: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=900&q=88", badge: null, tone: "#b98f64", stock: 30, status: "In stock" },
  { name: "Figue 07", brand: "Bureau Olfactif", family: "Green / Fresh", notes: "Fig leaf · Neroli · Soft woods", price: 1100, sizes: JSON.stringify(["10ml", "30ml"]), sizePrices: JSON.stringify({ "10ml": 1100, "30ml": 1900 }), sizeStocks: JSON.stringify({ "10ml": 12, "30ml": 10 }), audience: "Unisex", vibe: "Fresh", type: "EDT", premiumName: null, premiumPrice: null, premiumStock: 0, image: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=900&q=88", badge: "New", tone: "#b7c0aa", stock: 22, status: "In stock" },
];

let inMemoryProducts: Product[] = [];
let nextId = 1;

function ensureSeeded() {
  if (inMemoryProducts.length === 0) {
    inMemoryProducts = seedProducts.map((p) => ({
      ...p,
      id: nextId++,
      badge: p.badge ?? null,
      sizePrices: p.sizePrices ?? null,
      sizeStocks: p.sizeStocks ?? null,
      audience: p.audience ?? "Unisex",
      vibe: p.vibe ?? null,
      type: p.type ?? null,
      premiumName: p.premiumName ?? null,
      premiumPrice: p.premiumPrice ?? null,
      premiumStock: p.premiumStock ?? 0,
      stock: p.stock ?? 0,
      status: p.status ?? "In stock",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
}

export async function listProducts() {
  const db = await getDb();
  if (!db) {
    ensureSeeded();
    return inMemoryProducts;
  }
  const rows = await db.select().from(products);
  if (rows.length === 0) {
    await db.insert(products).values(seedProducts);
    return db.select().from(products);
  }
  return rows;
}

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) {
    ensureSeeded();
    const row: Product = {
      ...product,
      id: nextId++,
      badge: product.badge ?? null,
      sizePrices: product.sizePrices ?? null,
      sizeStocks: product.sizeStocks ?? null,
      audience: product.audience ?? "Unisex",
      vibe: product.vibe ?? null,
      type: product.type ?? null,
      premiumName: product.premiumName ?? null,
      premiumPrice: product.premiumPrice ?? null,
      premiumStock: product.premiumStock ?? 0,
      stock: product.stock ?? 0,
      status: product.status ?? "In stock",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryProducts.push(row);
    return row;
  }
  await db.insert(products).values(product);
}

export async function updateProduct(id: number, patch: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) {
    ensureSeeded();
    inMemoryProducts = inMemoryProducts.map((p) =>
      p.id === id ? { ...p, ...patch, updatedAt: new Date() } : p
    );
    return;
  }
  await db.update(products).set(patch).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) {
    inMemoryProducts = inMemoryProducts.filter(p => p.id !== id);
    return;
  }
  await db.delete(products).where(eq(products.id, id));
}

// ---------------------------------------------------------------------------
// Customers (storefront email/password accounts). In-memory fallback mirrors
// the products pattern so local dev works with no DATABASE_URL.
// ---------------------------------------------------------------------------

let inMemoryCustomers: Customer[] = [];
let nextCustomerId = 1;

export async function createCustomer(input: InsertCustomer): Promise<Customer> {
  const db = await getDb();
  if (!db) {
    const row: Customer = {
      ...input,
      id: nextCustomerId++,
      phone: input.phone ?? null,
      address: input.address ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: input.lastSignedIn ?? new Date(),
    };
    inMemoryCustomers.push(row);
    return row;
  }
  await db.insert(customers).values(input);
  const rows = await db.select().from(customers).where(eq(customers.email, input.email)).limit(1);
  if (!rows[0]) throw new Error("Failed to create customer");
  return rows[0];
}

export async function getCustomerByEmail(email: string): Promise<Customer | undefined> {
  const db = await getDb();
  if (!db) return inMemoryCustomers.find(c => c.email.toLowerCase() === email.toLowerCase());
  const rows = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  return rows[0];
}

export async function getCustomerById(id: number): Promise<Customer | undefined> {
  const db = await getDb();
  if (!db) return inMemoryCustomers.find(c => c.id === id);
  const rows = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return rows[0];
}

export async function listCustomers(): Promise<Customer[]> {
  const db = await getDb();
  if (!db) return [...inMemoryCustomers].reverse();
  return db.select().from(customers);
}

export async function touchCustomerSignin(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    inMemoryCustomers = inMemoryCustomers.map(c => c.id === id ? { ...c, lastSignedIn: new Date() } : c);
    return;
  }
  await db.update(customers).set({ lastSignedIn: new Date() }).where(eq(customers.id, id));
}

// ---------------------------------------------------------------------------
// Orders. Items snapshot product details at purchase time.
// ---------------------------------------------------------------------------

let inMemoryOrders: Order[] = [];
let nextOrderId = 1;

export const FREE_DELIVERY_THRESHOLD = 3000;
export const DELIVERY_FEE = 120;
export { DELIVERY_ZONES, deliveryFeeFor } from "../shared/order";
export type { DeliveryZone, PaymentMethod } from "../shared/order";

export function parseOrderItems(input: unknown): OrderItem[] {
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed as OrderItem[];
    } catch {
      return [];
    }
    return [];
  }
  return Array.isArray(input) ? (input as OrderItem[]) : [];
}

export async function createOrder(input: InsertOrder): Promise<Order> {
  const db = await getDb();
  if (!db) {
    const row: Order = {
      ...input,
      id: nextOrderId++,
      delivery: input.delivery ?? 0,
      status: input.status ?? "Pending",
      zone: input.zone ?? "inside",
      paymentMethod: input.paymentMethod ?? "cod",
      paidAmount: input.paidAmount ?? 0,
      senderNumber: input.senderNumber ?? null,
      trxId: input.trxId ?? null,
      couponCode: input.couponCode ?? null,
      discount: input.discount ?? 0,
      phone: input.phone ?? null,
      address: input.address ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryOrders.push(row);
    return row;
  }
  await db.insert(orders).values(input);
  const rows = await db.select().from(orders).orderBy(desc(orders.id)).limit(1);
  const created = rows[0];
  if (!created) throw new Error("Failed to create order");
  return created;
}

export async function listOrders(): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [...inMemoryOrders].reverse();
  const rows = await db.select().from(orders);
  return [...rows].reverse();
}

export async function listOrdersByCustomer(customerId: number): Promise<Order[]> {
  const db = await getDb();
  if (!db) return inMemoryOrders.filter(o => o.customerId === customerId).reverse();
  const rows = await db.select().from(orders).where(eq(orders.customerId, customerId));
  return [...rows].reverse();
}

export async function updateOrderStatus(id: number, status: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    inMemoryOrders = inMemoryOrders.map(o => o.id === id ? { ...o, status, updatedAt: new Date() } : o);
    return;
  }
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

// ---------------------------------------------------------------------------
// Coupons.
// ---------------------------------------------------------------------------

import { coupons, InsertCoupon, Coupon } from "../drizzle/schema";
import { storeSettings } from "../drizzle/schema";

let inMemoryCoupons: Coupon[] = [];
let nextCouponId = 1;

export async function listCoupons(): Promise<Coupon[]> {
  const db = await getDb();
  if (!db) return [...inMemoryCoupons].reverse();
  const rows = await db.select().from(coupons);
  return [...rows].reverse();
}

export async function createCoupon(input: InsertCoupon): Promise<Coupon> {
  const db = await getDb();
  if (!db) {
    const row: Coupon = {
      ...input,
      id: nextCouponId++,
      type: input.type ?? "percent",
      minSubtotal: input.minSubtotal ?? 0,
      expiresAt: input.expiresAt ?? null,
      active: input.active ?? "yes",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryCoupons.push(row);
    return row;
  }
  const rows = await db.insert(coupons).values(input).returning();
  if (!rows[0]) throw new Error("Failed to create coupon");
  return rows[0];
}

export async function updateCoupon(id: number, patch: Partial<InsertCoupon>): Promise<void> {
  const db = await getDb();
  if (!db) {
    inMemoryCoupons = inMemoryCoupons.map(c => c.id === id ? { ...c, ...patch, updatedAt: new Date() } : c);
    return;
  }
  await db.update(coupons).set(patch).where(eq(coupons.id, id));
}

export async function deleteCoupon(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    inMemoryCoupons = inMemoryCoupons.filter(c => c.id !== id);
    return;
  }
  await db.delete(coupons).where(eq(coupons.id, id));
}

export type CouponCheck =
  | { valid: true; code: string; type: string; value: number; discount: number }
  | { valid: false; message: string };

export async function checkCoupon(rawCode: string, subtotal: number): Promise<CouponCheck> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, message: "Enter a coupon code." };
  const all = await listCoupons();
  const coupon = all.find(c => c.code.toUpperCase() === code);
  if (!coupon || coupon.active !== "yes") return { valid: false, message: "This coupon is not valid." };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, message: "This coupon has expired." };
  }
  if (subtotal < (coupon.minSubtotal ?? 0)) {
    return { valid: false, message: `Needs minimum order of ৳${(coupon.minSubtotal ?? 0).toLocaleString("en-BD")}.` };
  }
  const discount = coupon.type === "flat"
    ? Math.min(coupon.value, subtotal)
    : Math.min(Math.floor((subtotal * coupon.value) / 100), subtotal);
  if (discount <= 0) return { valid: false, message: "This coupon gives no discount on this order." };
  return { valid: true, code: coupon.code, type: coupon.type, value: coupon.value, discount };
}

// ---------------------------------------------------------------------------
// Store settings (key/value with built-in fallbacks).
// ---------------------------------------------------------------------------

export const SETTING_DEFAULTS: Record<string, string> = {
  announcement: "Complimentary delivery over ৳3,000 ✳ Authenticity, always ✳ Small-batch edits / big presence",
  merchantNumber: "01814108729",
  supportEmail: "ukizbdofficial@gmail.com",
  supportPhone: "",
  freeThreshold: "3000",
};

export async function getStoreSettings(): Promise<Record<string, string>> {
  const result: Record<string, string> = { ...SETTING_DEFAULTS };
  try {
    const db = await getDb();
    if (!db) return result;
    const rows = await db.select().from(storeSettings);
    for (const row of rows) result[row.key] = row.value;
  } catch {
    // fall back to defaults
  }
  return result;
}

export async function setStoreSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(storeSettings).values({ key, value }).onConflictDoUpdate({
    target: storeSettings.key,
    set: { value },
  });
}
