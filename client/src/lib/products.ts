import { trpc } from "@/lib/trpc";

export type StoreProduct = {
  id: string;
  name: string;
  brand: string;
  family: string;
  notes: string;
  price: number;
  sizes: string[];
  sizePrices?: Record<string, number> | null;
  sizeStocks?: Record<string, number> | null;
  stock?: number;
  audience?: string;
  vibe?: string;
  type?: string;
  premiumName?: string;
  premiumPrice?: number;
  premiumStock?: number;
  image: string;
  badge?: string;
  tone: string;
  createdAt?: string;
};

export type SizeRow = { size: string; price: number; stock: number };

export function parseSizes(input: unknown): string[] {
  if (Array.isArray(input)) return input.map(String);
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // fall through
    }
    return input ? [input] : ["50ml"];
  }
  return ["50ml"];
}

export function parseSizePrices(input: unknown): Record<string, number> {
  if (!input || typeof input !== "object") {
    if (typeof input === "string") {
      try {
        const parsed = JSON.parse(input);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const out: Record<string, number> = {};
          for (const [k, v] of Object.entries(parsed)) {
            const n = Number(v);
            if (k && Number.isFinite(n) && n >= 0) out[k] = n;
          }
          return out;
        }
      } catch {
        // fall through
      }
    }
    return {};
  }
  if (Array.isArray(input)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const n = Number(v);
    if (k && Number.isFinite(n) && n >= 0) out[k] = n;
  }
  return out;
}

// Lowest price across base price + per-size prices. Used for "From ৳X" labels.
export function fromPrice(p: { price: number; sizePrices?: Record<string, number> | null }): number {
  const extra = p.sizePrices ? Object.values(p.sizePrices) : [];
  const all = [p.price, ...extra].filter((n) => Number.isFinite(n) && (n as number) >= 0) as number[];
  return all.length > 0 ? Math.min(...all) : p.price;
}

// Highest price (for price-range bounds).
export function maxPrice(p: { price: number; sizePrices?: Record<string, number> | null }): number {
  const extra = p.sizePrices ? Object.values(p.sizePrices) : [];
  const all = [p.price, ...extra].filter((n) => Number.isFinite(n) && (n as number) >= 0) as number[];
  return all.length > 0 ? Math.max(...all) : p.price;
}

// Stock for one size. Returns undefined when not tracked (treat as available).
export function stockForSize(p: { sizeStocks?: Record<string, number> | null; stock?: number }, size: string): number | undefined {
  const v = p.sizeStocks?.[size];
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, v);
  if (typeof p.stock === "number" && Number.isFinite(p.stock)) return Math.max(0, p.stock);
  return undefined;
}

export function hasPremium(p: { premiumName?: string; premiumPrice?: number }): boolean {
  return !!p.premiumName && typeof p.premiumPrice === "number" && p.premiumPrice > 0;
}

export function premiumAvailable(p: { premiumStock?: number }): boolean {
  return (p.premiumStock ?? 0) > 0;
}

// Unit price for a size + optional premium bottle on top.
export function unitPrice(
  p: { price: number; sizePrices?: Record<string, number> | null; premiumPrice?: number },
  size: string,
  withPremium: boolean
): number {
  const base = priceForSize(p, size);
  const extra = withPremium ? (p.premiumPrice ?? 0) : 0;
  return base + (Number.isFinite(extra) && extra > 0 ? extra : 0);
}

// For raw DB rows where sizePrices is still a JSON string (admin table).
export function minPrice(base: number, sizePricesRaw: unknown): number {
  return fromPrice({ price: base, sizePrices: parseSizePrices(sizePricesRaw) });
}

export function priceForSize(p: { price: number; sizePrices?: Record<string, number> | null }, size: string): number {
  const v = p.sizePrices?.[size];
  return typeof v === "number" && Number.isFinite(v) ? v : p.price;
}

// Compose server payload from admin size rows. Base price = lowest row price,
// stock = sum of row stocks.
export function buildSizePayload(rows: SizeRow[]): { sizes: string; sizePrices: string; sizeStocks: string; price: number; stock: number } {
  const clean = rows
    .map((r) => ({
      size: r.size.trim(),
      price: Math.max(0, Math.floor(Number(r.price) || 0)),
      stock: Math.max(0, Math.floor(Number(r.stock) || 0)),
    }))
    .filter((r) => r.size.length > 0);
  const fallback = [{ size: "50ml", price: 0, stock: 0 }];
  const list = clean.length > 0 ? clean : fallback;
  const prices: Record<string, number> = {};
  const stocks: Record<string, number> = {};
  list.forEach((r) => {
    prices[r.size] = r.price;
    stocks[r.size] = r.stock;
  });
  return {
    sizes: JSON.stringify(list.map((r) => r.size)),
    sizePrices: JSON.stringify(prices),
    sizeStocks: JSON.stringify(stocks),
    price: Math.min(...list.map((r) => r.price)),
    stock: list.reduce((sum, r) => sum + r.stock, 0),
  };
}

export const fallbackProducts: StoreProduct[] = [
  {
    id: "santal-04",
    name: "Santal 04",
    brand: "Maison Néroli",
    family: "Woody / Amber",
    notes: "Sandalwood · Cardamom · Cedar",
    price: 1850,
    sizes: ["10ml", "30ml", "50ml"],
    image:
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=88",
    badge: "Bestseller",
    tone: "#d7c1a0",
    stock: 42,
    sizeStocks: { "10ml": 20, "30ml": 12, "50ml": 10 },
    audience: "Unisex",
    vibe: "Woody",
    type: "EDP",
    premiumName: "Crystal flacon",
    premiumPrice: 1500,
    premiumStock: 5,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "musc-11",
    name: "Musc 11",
    brand: "Atelier N° 11",
    family: "Clean / Musky",
    notes: "White musk · Linen · Ambrette",
    price: 1250,
    sizes: ["10ml", "30ml"],
    image:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=88",
    badge: "New",
    tone: "#dad7d0",
    stock: 18,
    sizeStocks: { "10ml": 10, "30ml": 8 },
    audience: "Women",
    vibe: "Fresh",
    type: "EDT",
    createdAt: "2026-07-15T00:00:00.000Z",
  },
  {
    id: "bois-rose",
    name: "Bois Rosé",
    brand: "L'Objet Parfum",
    family: "Floral / Woody",
    notes: "Damask rose · Patchouli · Incense",
    price: 2200,
    sizes: ["10ml", "30ml", "50ml"],
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=88",
    tone: "#cdb2a2",
    stock: 27,
    sizeStocks: { "10ml": 12, "30ml": 9, "50ml": 6 },
    audience: "Women",
    vibe: "Floral",
    type: "EDP",
    createdAt: "2026-05-20T00:00:00.000Z",
  },
  {
    id: "vetiver-16",
    name: "Vetiver 16",
    brand: "Cendre Studio",
    family: "Green / Earthy",
    notes: "Vetiver · Grapefruit · Moss",
    price: 1650,
    sizes: ["10ml", "30ml"],
    image:
      "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=900&q=88",
    badge: "Limited",
    tone: "#aeb8ab",
    stock: 6,
    sizeStocks: { "10ml": 4, "30ml": 2 },
    audience: "Men",
    vibe: "Earthy",
    type: "EDT",
    createdAt: "2026-08-02T00:00:00.000Z",
  },
  {
    id: "ambre-09",
    name: "Ambre 09",
    brand: "Maison Néroli",
    family: "Amber / Spicy",
    notes: "Warm amber · Saffron · Vanilla",
    price: 1950,
    sizes: ["10ml", "30ml", "50ml"],
    image:
      "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=900&q=88",
    tone: "#b98f64",
    stock: 30,
    sizeStocks: { "10ml": 14, "30ml": 10, "50ml": 6 },
    audience: "Unisex",
    vibe: "Warm",
    type: "Parfum",
    premiumName: "Voyager case",
    premiumPrice: 800,
    premiumStock: 8,
    createdAt: "2026-04-11T00:00:00.000Z",
  },
  {
    id: "figue-07",
    name: "Figue 07",
    brand: "Bureau Olfactif",
    family: "Green / Fresh",
    notes: "Fig leaf · Neroli · Soft woods",
    price: 1100,
    sizes: ["10ml", "30ml"],
    image:
      "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=900&q=88",
    badge: "New",
    tone: "#b7c0aa",
    stock: 22,
    sizeStocks: { "10ml": 12, "30ml": 10 },
    audience: "Unisex",
    vibe: "Fresh",
    type: "EDT",
    createdAt: "2026-08-25T00:00:00.000Z",
  },
];

type DbProductRow = {
  id: string | number;
  name: string;
  brand: string;
  family: string;
  notes: string;
  price: number;
  sizes: string | string[];
  sizePrices?: string | Record<string, number> | null;
  sizeStocks?: string | Record<string, number> | null;
  stock?: number | null;
  audience?: string | null;
  vibe?: string | null;
  type?: string | null;
  premiumName?: string | null;
  premiumPrice?: number | null;
  premiumStock?: number | null;
  image: string;
  badge?: string | null;
  tone: string;
  createdAt?: string | Date | null;
};

export function toStoreProduct(row: DbProductRow): StoreProduct {
  const sizes = parseSizes(row.sizes);
  const sizePrices = parseSizePrices(row.sizePrices);
  const sizeStocks = parseSizePrices(row.sizeStocks);
  return {
    id: String(row.id),
    name: row.name,
    brand: row.brand,
    family: row.family,
    notes: row.notes,
    price: row.price,
    sizes,
    sizePrices,
    sizeStocks: Object.keys(sizeStocks).length > 0 ? sizeStocks : undefined,
    stock: typeof row.stock === "number" ? row.stock : undefined,
    audience: row.audience ?? "Unisex",
    vibe: row.vibe ?? undefined,
    type: row.type ?? undefined,
    premiumName: row.premiumName ?? undefined,
    premiumPrice: typeof row.premiumPrice === "number" ? row.premiumPrice : undefined,
    premiumStock: typeof row.premiumStock === "number" ? row.premiumStock : 0,
    image: row.image,
    badge: row.badge ?? undefined,
    tone: row.tone,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
  };
}

// Single source of truth: server DB (trpc.products.list).
// Falls back to static list while loading / when DB is empty so UI never breaks.
export function useProducts() {
  const query = trpc.products.list.useQuery(undefined, {
    staleTime: 1000 * 30,
  });
  const rows = query.data;
  const products: StoreProduct[] = rows?.map(toStoreProduct) ?? [];
  return { ...query, products };
}
