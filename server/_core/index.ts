import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ENV, getCookieSecret } from "./env";
import { csrfOriginGuard, parseAllowedOrigins } from "./originCheck";
import { ipThrottle } from "./rateLimit";
import { canonicalOrigin, httpsRedirect, securityHeaders } from "./securityHeaders";
import { hasAdminCredentials, validateAdminEnv } from "../adminAuth";
import { checkDatabase, createPayment, findPaymentByProviderId, getOrderById, getOrderByPaymentReference, listProducts, updateOrderPayment, updateOrderStatus, updatePayment } from "../db";
import { executeBkashPayment, parseBkashCallback, queryBkashPayment, verifyBkashWebhook } from "../bkash";

// Fail fast on missing secrets BEFORE accepting traffic. In production a
// missing JWT_SECRET or admin credential pair means forgeable sessions or a
// permanently locked-out panel — refuse to boot instead. Dev/test just warn
// (a random per-process secret keeps sessions working locally).
function validateRuntimeEnv() {
  getCookieSecret(); // throws in production when JWT_SECRET is unset
  if (ENV.isProduction) {
    if (!process.env.DATABASE_URL?.trim()) {
      throw new Error("[Database] DATABASE_URL is required in production. Refusing to start with in-memory data.");
    }
    validateAdminEnv(); // throws when ADMIN_LOGIN_ID / password hash are unset
  } else if (!hasAdminCredentials()) {
    console.warn("[Admin] ADMIN_LOGIN_ID / ADMIN_PASSWORD_HASH not set — admin login is disabled in development.");
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  validateRuntimeEnv();

  const database = await checkDatabase();
  if (ENV.isProduction && !database.ok) {
    throw new Error(`[Database] Production startup blocked: ${database.error ?? "database is unavailable"}`);
  }
  if (database.ok) console.log("[Database] Connected — serving live Supabase data.");
  else console.warn(`[Database] ${database.error} Serving in-memory seed data in development.`);

  const app = express();
  const server = createServer(app);
  // Correct client IPs / proto behind the TLS-terminating proxy, and never
  // leak the framework banner.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  // Transport security first: production http:// becomes https://, then the
  // content-security headers land on every response (including static).
  app.use(httpsRedirect());
  app.use(securityHeaders());
  // CSRF: reject cross-origin state-changing requests before any body parsing.
  // Session cookies are SameSite=None (OAuth iframe), so the browser would
  // otherwise happily attach them to foreign POSTs.
  app.use(csrfOriginGuard(parseAllowedOrigins(process.env.ALLOWED_ORIGINS)));
  // Blunt per-IP throttle over the whole API surface (scrapers, hot loops).
  // Auth endpoints and sensitive procedures carry their own stricter budgets.
  app.use("/api", ipThrottle("api", 600, 10 * 60_000));
  // Body parsing. tRPC carries base64 image uploads (~6MB), so it gets a 10MB
  // JSON budget scoped to its path; everything else stays at 1MB so a giant
  // body cannot pin memory (was 50MB globally). body-parser marks parsed
  // bodies, so the global parser skips requests already handled by the scoped
  // one.
  app.use("/api/trpc", express.json({ limit: "10mb" }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "100kb", extended: true }));
  app.get("/healthz", async (_req, res) => {
    const result = await checkDatabase();
    res.status(result.ok || !ENV.isProduction ? 200 : 503).json({
      ok: result.ok || !ENV.isProduction,
      database: result.ok ? "connected" : "unavailable",
    });
  });
  app.get("/api/payments/bkash/callback", async (req, res) => {
    const callback = parseBkashCallback(req.query as Record<string, unknown>);
    if (!callback.paymentId) return res.status(400).send("Missing bKash payment ID.");
    const payment = await findPaymentByProviderId(callback.paymentId);
    if (!payment) return res.status(404).send("Payment session not found.");
    const order = await getOrderById(payment.orderId);
    if (!order) return res.status(404).send("Order not found.");
    if (callback.status !== "success") {
      await updatePayment(payment.id, { status: callback.status === "cancel" ? "cancelled" : "failed" });
      await updateOrderStatus(order.id, "Cancelled");
      return res.redirect(303, `/order-success?payment=failed&order=${order.id}`);
    }
    try {
      let result: Record<string, unknown>;
      try {
        result = await executeBkashPayment(callback.paymentId);
      } catch {
        result = await queryBkashPayment(callback.paymentId);
      }
      const amount = Number(result.amount);
      if (result.transactionStatus !== "Completed" || !Number.isFinite(amount) || amount !== order.total || result.currency !== "BDT") {
        throw new Error("bKash returned an invalid amount or transaction status.");
      }
      const trxId = typeof result.trxId === "string" ? result.trxId : null;
      await updatePayment(payment.id, { status: "completed", providerTransactionId: trxId, rawPayload: JSON.stringify(result) });
      await updateOrderPayment(order.id, { paymentStatus: "paid", paymentProvider: "bkash", paymentReference: order.paymentReference, paidAmount: order.total, status: "Processing" });
      return res.redirect(303, `/order-success?payment=success&order=${order.id}`);
    } catch (error) {
      await updatePayment(payment.id, { status: "failed", rawPayload: JSON.stringify({ error: error instanceof Error ? error.message : "verification failed" }) });
      await updateOrderStatus(order.id, "Cancelled");
      return res.redirect(303, `/order-success?payment=failed&order=${order.id}`);
    }
  });
  app.post("/api/payments/bkash/webhook", async (req, res) => {
    const verified = await verifyBkashWebhook(req.body);
    if (!verified) return res.status(401).send("Invalid webhook signature.");
    if (verified.Type === "SubscriptionConfirmation" && typeof verified.SubscribeURL === "string") {
      const subscriptionUrl = new URL(verified.SubscribeURL);
      if (subscriptionUrl.protocol === "https:" && subscriptionUrl.hostname.endsWith(".amazonaws.com")) await fetch(subscriptionUrl);
      return res.status(204).end();
    }
    const rawMessage = verified.Message;
    let message: Record<string, unknown>;
    try {
      const parsed: unknown = typeof rawMessage === "string" ? JSON.parse(rawMessage) : rawMessage;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return res.status(400).send("Invalid webhook message.");
      message = parsed as Record<string, unknown>;
    } catch {
      return res.status(400).send("Invalid webhook message.");
    }
    if (message.transactionStatus !== "Completed") return res.status(204).end();
    const invoice = typeof message.merchantInvoiceNumber === "string" ? message.merchantInvoiceNumber : "";
    const order = invoice ? await getOrderByPaymentReference(invoice) : undefined;
    if (!order || order.paymentStatus === "paid") return res.status(204).end();
    const amount = Number(message.amount);
    if (!Number.isFinite(amount) || amount !== order.total || message.currency !== "BDT") return res.status(422).send("Invalid payment amount.");
    const trxId = typeof message.trxID === "string" ? message.trxID : null;
    await createPayment({ orderId: order.id, provider: "bkash", providerTransactionId: trxId, amount: order.total, status: "completed", rawPayload: JSON.stringify(message) });
    await updateOrderPayment(order.id, { paymentStatus: "paid", paymentProvider: "bkash", paymentReference: invoice, paidAmount: order.total, status: "Processing" });
    return res.status(204).end();
  });
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const products = await listProducts();
      const origin = canonicalOrigin();
      const routes = ["/", "/shop", "/finder", "/about", "/contact", "/refund-policy"];
      const productRoutes = products.map(product => `/product/${encodeURIComponent(String(product.id))}`);
      const entries = [...routes, ...productRoutes].map(route => {
        const location = `${origin}${route}`.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `  <url><loc>${location}</loc></url>`;
      });
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`);
    } catch (error) {
      console.error("[SEO] Failed to build sitemap:", error instanceof Error ? error.message : String(error));
      res.status(503).type("text/plain").send("Sitemap temporarily unavailable.");
    }
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = Number.parseInt(process.env.PORT || "3000", 10);
  if (!Number.isInteger(preferredPort) || preferredPort < 1024 || preferredPort > 65535) {
    throw new Error("[Server] PORT must be an integer between 1024 and 65535.");
  }
  const port = ENV.isProduction ? preferredPort : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
