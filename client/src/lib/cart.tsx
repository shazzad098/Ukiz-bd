import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { StoreProduct } from "@/lib/products";
import { stockForSize, unitPrice } from "@/lib/products";

export type CartItem = StoreProduct & { size: string; quantity: number; premium?: boolean };

type CartLine = Pick<CartItem, "id" | "size" | "premium">;

export function cartLineKey(item: CartLine): string {
  return `${item.id}::${encodeURIComponent(item.size)}::${item.premium ? "premium" : "standard"}`;
}

const STORAGE_KEY = "ukix-cart";

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        !!item && typeof item.id === "string" && typeof item.size === "string" &&
        typeof item.quantity === "number" && Number.isFinite(item.quantity) && item.quantity >= 1 &&
        typeof item.price === "number" && Number.isFinite(item.price)
    );
  } catch {
    return [];
  }
}

function availableStock(item: CartItem): number | undefined {
  const sizeStock = stockForSize(item, item.size);
  if (item.premium !== true) return sizeStock;
  const premiumStock = item.premiumStock ?? 0;
  return sizeStock === undefined ? premiumStock : Math.min(sizeStock, premiumStock);
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (product: StoreProduct, size?: string, quantity?: number, withPremium?: boolean) => boolean;
  updateQuantity: (lineKey: string, delta: number) => boolean;
  removeItem: (lineKey: string) => void;
  updateSize: (lineKey: string, newSize: string) => boolean;
  togglePremium: (lineKey: string) => boolean;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);
  const itemsRef = useRef(items);

  const commit = useCallback((update: (current: CartItem[]) => CartItem[]) => {
    const next = update(itemsRef.current);
    itemsRef.current = next;
    setItems(next);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage unavailable — the in-memory cart remains usable for this session.
    }
  }, [items]);

  const addItem = useCallback((product: StoreProduct, size?: string, quantity?: number, withPremium?: boolean) => {
    const chosen = size ?? product.sizes[0];
    if (!chosen || !product.sizes.includes(chosen)) return false;
    const premium = withPremium === true && !!product.premiumName && (product.premiumPrice ?? 0) > 0;
    const desired = Math.max(1, Math.floor(quantity ?? 1));
    const sizeStock = stockForSize(product, chosen);
    const max = premium ? Math.min(sizeStock ?? Number.POSITIVE_INFINITY, product.premiumStock ?? 0) : sizeStock;
    if (max === 0) return false;

    const key = cartLineKey({ id: product.id, size: chosen, premium });
    const existing = itemsRef.current.find((item) => cartLineKey(item) === key);
    const currentQuantity = existing?.quantity ?? 0;
    if (max !== undefined && currentQuantity >= max) return false;

    const nextQuantity = Math.min(currentQuantity + desired, max ?? Number.POSITIVE_INFINITY);
    const line: CartItem = { ...product, size: chosen, premium, price: unitPrice(product, chosen, premium), quantity: nextQuantity };
    commit((current) => existing
      ? current.map((item) => cartLineKey(item) === key ? line : item)
      : [...current, line]
    );
    return true;
  }, [commit]);

  const updateQuantity = useCallback((lineKey: string, delta: number) => {
    const line = itemsRef.current.find((item) => cartLineKey(item) === lineKey);
    if (!line || !Number.isFinite(delta) || delta === 0) return false;
    const max = availableStock(line);
    const nextQuantity = delta > 0
      ? Math.min(line.quantity + Math.floor(delta), max ?? Number.POSITIVE_INFINITY)
      : Math.max(1, line.quantity + Math.ceil(delta));
    if (nextQuantity === line.quantity) return false;
    commit((current) => current.map((item) => cartLineKey(item) === lineKey ? { ...item, quantity: nextQuantity } : item));
    return true;
  }, [commit]);

  const removeItem = useCallback((lineKey: string) => {
    commit((current) => current.filter((item) => cartLineKey(item) !== lineKey));
  }, [commit]);

  const updateSize = useCallback((lineKey: string, newSize: string) => {
    const line = itemsRef.current.find((item) => cartLineKey(item) === lineKey);
    if (!line) return false;
    if (line.size === newSize) return true;
    const sizeStock = stockForSize(line, newSize);
    const max = line.premium === true ? Math.min(sizeStock ?? Number.POSITIVE_INFINITY, line.premiumStock ?? 0) : sizeStock;
    if (max === 0) return false;

    const newcomer: CartItem = {
      ...line,
      size: newSize,
      price: unitPrice(line, newSize, line.premium === true),
      quantity: Math.min(line.quantity, max ?? Number.POSITIVE_INFINITY),
    };
    const oldKey = cartLineKey(line);
    const newKey = cartLineKey(newcomer);
    const twin = itemsRef.current.find((item) => cartLineKey(item) === newKey);
    const mergedQuantity = Math.min((twin?.quantity ?? 0) + newcomer.quantity, max ?? Number.POSITIVE_INFINITY);
    if (mergedQuantity < 1) return false;

    commit((current) => {
      const rest = current.filter((item) => cartLineKey(item) !== oldKey && cartLineKey(item) !== newKey);
      return [...rest, { ...newcomer, quantity: mergedQuantity }];
    });
    return true;
  }, [commit]);

  const togglePremium = useCallback((lineKey: string) => {
    const line = itemsRef.current.find((item) => cartLineKey(item) === lineKey);
    if (!line) return false;
    if (!line.premiumName || !(line.premiumPrice && line.premiumPrice > 0)) return false;

    const premium = line.premium !== true;
    const sizeStock = stockForSize(line, line.size);
    const max = premium ? Math.min(sizeStock ?? Number.POSITIVE_INFINITY, line.premiumStock ?? 0) : sizeStock;
    if (max === 0) return false;

    const newcomer: CartItem = {
      ...line,
      premium,
      price: unitPrice(line, line.size, premium),
      quantity: Math.min(line.quantity, max ?? Number.POSITIVE_INFINITY),
    };
    const oldKey = cartLineKey(line);
    const newKey = cartLineKey(newcomer);
    const twin = itemsRef.current.find((item) => cartLineKey(item) === newKey);
    const mergedQuantity = Math.min((twin?.quantity ?? 0) + newcomer.quantity, max ?? Number.POSITIVE_INFINITY);
    if (mergedQuantity < 1) return false;

    commit((current) => {
      const rest = current.filter((item) => cartLineKey(item) !== oldKey && cartLineKey(item) !== newKey);
      return [...rest, { ...newcomer, quantity: mergedQuantity }];
    });
    return true;
  }, [commit]);

  const clear = useCallback(() => commit(() => []), [commit]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { items, count, total, addItem, updateQuantity, removeItem, updateSize, togglePremium, clear };
  }, [items, addItem, updateQuantity, removeItem, updateSize, togglePremium, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
