import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { StoreProduct } from "@/lib/products";
import { priceForSize, stockForSize, unitPrice } from "@/lib/products";

export type CartItem = StoreProduct & { size: string; quantity: number; premium?: boolean };

const STORAGE_KEY = "ukix-cart";

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        !!item && typeof item.id !== "undefined" && typeof item.quantity === "number" && typeof item.price === "number"
    );
  } catch {
    return [];
  }
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (product: StoreProduct, size?: string, quantity?: number, withPremium?: boolean) => void;
  updateQuantity: (id: string, size: string, delta: number) => void;
  removeItem: (id: string, size: string) => void;
  updateSize: (id: string, oldSize: string, newSize: string) => boolean;
  togglePremium: (id: string, size: string) => boolean;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable — cart just won't persist
    }
  }, [items]);

  const addItem = useCallback((product: StoreProduct, size?: string, quantity?: number, withPremium?: boolean) => {
    const chosen = size ?? product.sizes[0] ?? "50ml";
    const qty = Math.max(1, Math.floor(quantity ?? 1));
    const premium = withPremium === true && !!product.premiumName && (product.premiumPrice ?? 0) > 0 && (product.premiumStock ?? 0) > 0;
    setItems((previous) => {
      const existing = previous.find((item) => item.id === product.id && item.size === chosen && (item.premium === true) === premium);
      if (existing) {
        return previous.map((item) =>
          item.id === product.id && item.size === chosen && (item.premium === true) === premium ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...previous, { ...product, size: chosen, premium, price: unitPrice(product, chosen, premium), quantity: qty }];
    });
  }, []);

  const updateQuantity = useCallback((id: string, size: string, delta: number) => {
    setItems((previous) =>
      previous.map((item) =>
        item.id === id && item.size === size ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  }, []);

  const removeItem = useCallback((id: string, size: string) => {
    setItems((previous) => previous.filter((item) => !(item.id === id && item.size === size)));
  }, []);

  // Switch an item to another size (price follows the size). Merges into an
  // existing line when the same product+size+premium combo already exists.
  // Returns false when the target size is out of stock.
  const updateSize = useCallback((id: string, oldSize: string, newSize: string) => {
    if (oldSize === newSize) return true;
    let ok = true;
    setItems((previous) => {
      const line = previous.find((item) => item.id === id && item.size === oldSize);
      if (!line) return previous;
      const stock = stockForSize(line, newSize);
      if (stock === 0) {
        ok = false;
        return previous;
      }
      const rest = previous.filter((item) => !(item.id === id && item.size === oldSize));
      const newcomer = {
        ...line,
        size: newSize,
        price: unitPrice(line, newSize, line.premium === true),
        quantity: stock !== undefined ? Math.min(line.quantity, Math.max(1, stock)) : line.quantity,
      };
      const twin = rest.find((item) => item.id === id && item.size === newSize && (item.premium === true) === (newcomer.premium === true));
      if (twin) {
        const cap = stockForSize(line, newSize);
        return rest.map((item) =>
          item === twin
            ? { ...item, quantity: cap !== undefined ? Math.min(item.quantity + newcomer.quantity, Math.max(1, cap)) : item.quantity + newcomer.quantity }
            : item
        );
      }
      return [...rest, newcomer];
    });
    return ok;
  }, []);

  // Toggle the premium bottle option on a line. Returns false when unavailable.
  const togglePremium = useCallback((id: string, size: string) => {
    let ok = true;
    setItems((previous) => {
      const line = previous.find((item) => item.id === id && item.size === size);
      if (!line) return previous;
      if (!line.premiumName || !(line.premiumPrice && line.premiumPrice > 0) || (line.premiumStock ?? 0) <= 0) {
        ok = false;
        return previous;
      }
      const premium = !(line.premium === true);
      return previous.map((item) =>
        item.id === id && item.size === size ? { ...item, premium, price: unitPrice(item, item.size, premium) } : item
      );
    });
    return ok;
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { items, count, total, addItem, updateQuantity, removeItem, updateSize, togglePremium, clear };
  }, [items, addItem, updateQuantity, removeItem, updateSize, togglePremium, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
