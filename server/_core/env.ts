import crypto from "node:crypto";

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

// ---------------------------------------------------------------------------
// Session signing secret.
//
// JWT_SECRET is the ONLY supported source for the secret that signs admin,
// customer and OAuth session tokens. There is deliberately no hardcoded
// fallback: a production server without it refuses to start (fail fast),
// because a known constant would let anyone mint valid sessions. In dev/test
// a random per-process secret keeps everything working — sessions simply
// reset when the process restarts.
// ---------------------------------------------------------------------------

let devSecret: string | null = null;

export function getCookieSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  if (ENV.isProduction) {
    throw new Error(
      "[Env] JWT_SECRET is not set. Refusing to start: session cookies would be forgeable. " +
        "Generate one with: node -e \"console.log(require('node:crypto').randomBytes(32).toString('hex'))\""
    );
  }
  if (!devSecret) devSecret = crypto.randomBytes(32).toString("hex");
  return devSecret;
}
