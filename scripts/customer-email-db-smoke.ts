import { eq } from "drizzle-orm";
import { customers } from "../drizzle/schema";
import { getCustomerByEmail, getDb } from "../server/db";

async function verifyMixedCaseLookup() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is required for the customer email integration smoke.");
  const email = `Legacy.${Date.now()}.${Math.random().toString(36).slice(2)}@Example.COM`;
  let customerId: number | undefined;
  try {
    const rows = await db.insert(customers).values({
      name: "Migration smoke customer",
      email,
      passwordHash: "test-only-hash",
    }).returning({ id: customers.id });
    customerId = rows[0]?.id;
    if (!customerId) throw new Error("The test customer was not inserted.");

    const found = await getCustomerByEmail(email.toLowerCase());
    if (found?.id !== customerId) throw new Error("Case-insensitive customer lookup failed.");
    console.log("Case-insensitive customer email lookup passed.");
  } finally {
    try {
      if (customerId) await db.delete(customers).where(eq(customers.id, customerId));
    } finally {
      await db.$client.end({ timeout: 5 });
    }
  }
}

void verifyMixedCaseLookup().catch(() => {
  console.error("Case-insensitive customer email integration smoke failed.");
  process.exitCode = 1;
});
