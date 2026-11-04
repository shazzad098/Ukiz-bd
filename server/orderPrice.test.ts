// Order pricing integrity: the server must never trust client-sent prices.
//
// DATABASE_URL is forced empty so getDb() (which reads it lazily at first
// query, i.e. after these imports run) always uses the in-memory catalogue —
// this test can never touch a real database.
process.env.DATABASE_URL = "";

import { beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { CUSTOMER_COOKIE } from "./customerAuth";
import type { TrpcContext } from "./_core/context";
import { createProduct, listProducts, updateOrderStatus } from "./db";

type Captured = Array<{ name: string; value: string }>;

beforeAll(async () => {
  await createProduct({
    name: "Fixture Scent A", brand: "Fixture House A", family: "Woody / Test", notes: "Fixture note A",
    price: 1850, sizes: JSON.stringify(["10ml", "30ml"]),
    sizePrices: JSON.stringify({ "10ml": 1850, "30ml": 3200 }),
    sizeStocks: JSON.stringify({ "10ml": 20, "30ml": 12 }), audience: "Unisex", vibe: "Woody", type: "EDP",
    premiumName: "Fixture Bottle", premiumPrice: 1500, premiumStock: 6,
    image: "https://images.example.test/fixture-a.webp", badge: null, tone: "#c7b08a", stock: 42, status: "In stock",
  });
  await createProduct({
    name: "Fixture Scent B", brand: "Fixture House B", family: "Fresh / Test", notes: "Fixture note B",
    price: 1250, sizes: JSON.stringify(["10ml", "30ml"]),
    sizePrices: JSON.stringify({ "10ml": 1250, "30ml": 2100 }),
    sizeStocks: JSON.stringify({ "10ml": 10, "30ml": 8 }), audience: "Unisex", vibe: "Fresh", type: "EDT",
    premiumName: null, premiumPrice: null, premiumStock: 0,
    image: "https://images.example.test/fixture-b.webp", badge: null, tone: "#dad7d0", stock: 18, status: "In stock",
  });
});


function mockReq(cookieHeader?: string) {
  return {
    protocol: "http",
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    socket: { remoteAddress: "127.0.0.1" },
  } as unknown as TrpcContext["req"];
}

function mockRes(captured: Captured) {
  return {
    cookie: (name: string, value: string) => captured.push({ name, value }),
    clearCookie: () => {},
  } as unknown as TrpcContext["res"];
}

/** Signs up a fresh customer and returns a context carrying the session cookie. */
async function signIn(name: string, phone: string): Promise<TrpcContext> {
  const captured: Captured = [];
  const signupCtx: TrpcContext = { req: mockReq(), res: mockRes(captured), user: null };
  await appRouter.createCaller(signupCtx).customer.signup({
    name,
    email: `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: "secret123",
    phone,
  });
  const cookie = captured[0];
  if (!cookie || cookie.name !== CUSTOMER_COOKIE) throw new Error("signup did not issue a customer session cookie");
  return { req: mockReq(`${cookie.name}=${cookie.value}`), res: mockRes([]), user: null };
}

describe("orders.create price integrity", () => {
  it("recomputes prices from the catalogue and ignores tampered client prices", async () => {
    const caller = appRouter.createCaller(await signIn("Price Tester", "01700000000"));

    // Fixture product #1: 10ml list price ৳1850. The client claims ৳1.
    const result = await caller.orders.create({
      items: [
        {
          productId: "1",
          name: "FAKE NAME",
          brand: "FAKE BRAND",
          size: "10ml",
          price: 1,
          quantity: 1,
          image: "https://evil.example/x.png",
        },
      ],
      name: "Price Tester",
      phone: "01700000000",
      address: "Dhaka",
      zone: "inside",
      paymentMethod: "cod",
    });

    // Server total = 1850 + 80 (inside Dhaka, under the ৳3000 free threshold).
    expect(result.total).toBe(1930);

    // The stored snapshot carries catalogue values, not the tampered ones.
    const mine = await caller.orders.mine();
    const storedItem = mine[mine.length - 1]!.items[0]!;
    expect(storedItem.name).toBe("Fixture Scent A");
    expect(storedItem.brand).toBe("Fixture House A");
    expect(storedItem.price).toBe(1850);
    expect(storedItem.image).toBe("https://images.example.test/fixture-a.webp");
  });

  it("charges the premium bottle on top of the size price when requested", async () => {
    const caller = appRouter.createCaller(await signIn("Premium Tester", "01700000001"));

    // Fixture Scent A 10ml (৳1850) + "Fixture Bottle" premium (৳1500) = ৳3350 → free delivery.
    const result = await caller.orders.create({
      items: [
        {
          productId: "1",
          name: "Fixture Scent A",
          size: "10ml",
          price: 10,
          quantity: 1,
          premium: "Fixture Bottle",
        },
      ],
      name: "Premium Tester",
      phone: "01700000001",
      address: "Dhaka",
      zone: "inside",
      paymentMethod: "cod",
    });
    expect(result.total).toBe(3350);
  });

  it("rejects unknown products, unknown sizes and premiums that do not exist", async () => {
    const caller = appRouter.createCaller(await signIn("Reject Tester", "01700000002"));
    const base = {
      name: "Reject Tester",
      phone: "01700000002",
      address: "Dhaka",
      zone: "inside" as const,
      paymentMethod: "cod" as const,
    };

    // Unknown product id.
    await expect(
      caller.orders.create({
        ...base,
        items: [{ productId: "9999", name: "Ghost", size: "10ml", price: 1, quantity: 1 }],
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    // Size the product does not come in.
    await expect(
      caller.orders.create({
        ...base,
        items: [{ productId: "1", name: "Fixture Scent A", size: "999ml", price: 1, quantity: 1 }],
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    // Premium bottle claimed on a product that has none (product #2, Fixture Scent B).
    await expect(
      caller.orders.create({
        ...base,
        items: [{ productId: "2", name: "Fixture Scent B", size: "10ml", price: 1, quantity: 1, premium: "Ghost bottle" }],
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("orders.create inventory validation", () => {
  it("reserves duplicate lines atomically and releases them on cancellation", async () => {
    const caller = appRouter.createCaller(await signIn("Atomic Stock Tester", "01700000005"));
    const before = (await listProducts()).find(product => product.id === 2)!;
    const beforeStocks = JSON.parse(before.sizeStocks ?? "{}");
    const result = await caller.orders.create({
      items: [
        { productId: "2", name: "Fixture Scent B", size: "10ml", price: 1, quantity: 2 },
        { productId: "2", name: "Fixture Scent B", size: "10ml", price: 1, quantity: 3 },
      ],
      name: "Atomic Stock Tester",
      phone: "01700000005",
      address: "Dhaka",
      zone: "inside",
      paymentMethod: "cod",
    });
    const reserved = (await listProducts()).find(product => product.id === 2)!;
    expect(JSON.parse(reserved.sizeStocks ?? "{}")["10ml"]).toBe(beforeStocks["10ml"] - 5);
    await updateOrderStatus(result.orderId, "Cancelled");
    const released = (await listProducts()).find(product => product.id === 2)!;
    expect(JSON.parse(released.sizeStocks ?? "{}")["10ml"]).toBe(beforeStocks["10ml"]);
  });

  it("rejects a quantity above the selected size stock", async () => {
    const caller = appRouter.createCaller(await signIn("Stock Tester", "01700000003"));
    await expect(
      caller.orders.create({
        items: [{ productId: "1", name: "Fixture Scent A", size: "10ml", price: 1, quantity: 21 }],
        name: "Stock Tester",
        phone: "01700000003",
        address: "Dhaka",
        zone: "inside",
        paymentMethod: "cod",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects premium quantities above the available premium stock", async () => {
    const caller = appRouter.createCaller(await signIn("Premium Stock Tester", "01700000004"));
    await expect(
      caller.orders.create({
        items: [{ productId: "1", name: "Fixture Scent A", size: "10ml", price: 1, quantity: 6, premium: "Fixture Bottle" }],
        name: "Premium Stock Tester",
        phone: "01700000004",
        address: "Dhaka",
        zone: "inside",
        paymentMethod: "cod",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
