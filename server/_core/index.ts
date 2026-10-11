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
import { httpsRedirect, securityHeaders } from "./securityHeaders";
import { hasAdminCredentials, validateAdminEnv } from "../adminAuth";
import { checkDatabase } from "../db";

// Fail fast on missing secrets BEFORE accepting traffic. In production a
// missing JWT_SECRET or admin credential pair means forgeable sessions or a
// permanently locked-out panel — refuse to boot instead. Dev/test just warn
// (a random per-process secret keeps sessions working locally).
function validateRuntimeEnv() {
  getCookieSecret(); // throws in production when JWT_SECRET is unset
  if (ENV.isProduction) {
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

  // Database health: log-only, never blocks boot. When Supabase is
  // unreachable the app keeps serving on in-memory seed data — this line
  // makes that visible instead of silent.
  checkDatabase().then(result => {
    if (result.ok) {
      console.log("[Database] Connected — serving live Supabase data.");
    } else {
      console.warn(`[Database] ${result.error} Serving in-memory seed data instead.`);
    }
  });

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

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
