type BkashConfig = {
  baseUrl: string;
  username: string;
  password: string;
  appKey: string;
  appSecret: string;
  publicAppUrl: string;
};

type BkashResponse = Record<string, unknown>;

let cachedToken: { value: string; expiresAt: number } | null = null;

function config(): BkashConfig | null {
  const values = {
    baseUrl: process.env.BKASH_BASE_URL?.trim(),
    username: process.env.BKASH_USERNAME?.trim(),
    password: process.env.BKASH_PASSWORD?.trim(),
    appKey: process.env.BKASH_APP_KEY?.trim(),
    appSecret: process.env.BKASH_APP_SECRET?.trim(),
    publicAppUrl: process.env.PUBLIC_APP_URL?.trim(),
  };
  return Object.values(values).every(Boolean) ? values as BkashConfig : null;
}

export function isBkashConfigured() {
  return config() !== null;
}

async function request(path: string, init: RequestInit) {
  const response = await fetch(`${config()!.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
    ...init,
    signal: AbortSignal.timeout(30_000),
  });
  const body = await response.json().catch(() => ({})) as BkashResponse;
  if (!response.ok || (typeof body.statusCode === "string" && body.statusCode !== "0000")) {
    const message = typeof body.errorMessageEn === "string" ? body.errorMessageEn : typeof body.statusMessage === "string" ? body.statusMessage : `bKash request failed (${response.status})`;
    throw new Error(message);
  }
  return body;
}

async function accessToken() {
  const current = config();
  if (!current) throw new Error("bKash gateway is not configured.");
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const body = await request("auth/grant-token", {
    method: "POST",
    headers: { username: current.username, password: current.password, "content-type": "application/json" },
    body: JSON.stringify({ app_key: current.appKey, app_secret: current.appSecret }),
  });
  const token = typeof body.id_token === "string" ? body.id_token : "";
  const expiresIn = Number(body.expires_in) || 3600;
  if (!token) throw new Error("bKash did not return an access token.");
  cachedToken = { value: token, expiresAt: Date.now() + expiresIn * 1000 };
  return token;
}

async function authorizedRequest(path: string, body: Record<string, unknown>) {
  const current = config();
  if (!current) throw new Error("bKash gateway is not configured.");
  const token = await accessToken();
  return request(path, {
    method: "POST",
    headers: { Authorization: token, "X-App-Key": current.appKey, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function createBkashPayment(input: { orderId: number; amount: number; customerReference: string }) {
  const current = config();
  if (!current) throw new Error("bKash gateway is not configured.");
  const merchantInvoiceNumber = `UKIZ-${input.orderId}-${Date.now()}`;
  const body = await authorizedRequest("payment/create", {
    payerReference: input.customerReference.slice(0, 255),
    callbackURL: `${current.publicAppUrl.replace(/\/$/, "")}/api/payments/bkash/callback`,
    amount: input.amount.toFixed(2),
    currency: "BDT",
    intent: "sale",
    merchantInvoiceNumber,
  });
  const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
  const redirectUrl = typeof body.bKashURL === "string" ? body.bKashURL : typeof body.bkashURL === "string" ? body.bkashURL : "";
  if (!paymentId || !redirectUrl) throw new Error("bKash did not return a checkout URL.");
  return { paymentId, redirectUrl, merchantInvoiceNumber, raw: body };
}

export async function executeBkashPayment(paymentId: string) {
  return authorizedRequest("payment/execute", { paymentId });
}

export async function queryBkashPayment(paymentId: string) {
  return authorizedRequest("payment/query", { paymentId });
}

export function parseBkashCallback(input: Record<string, unknown>) {
  return {
    paymentId: typeof input.paymentID === "string" ? input.paymentID : "",
    status: typeof input.status === "string" ? input.status : "",
    signature: typeof input.signature === "string" ? input.signature : "",
  };
}

function snsStringToSign(message: Record<string, unknown>) {
  const fields = message.Type === "Notification"
    ? ["Message", "MessageId", "Subject", "Timestamp", "TopicArn", "Type"]
    : ["Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"];
  return fields.filter(field => message[field] !== undefined && message[field] !== null).map(field => `${field}\n${typeof message[field] === "string" ? message[field] : JSON.stringify(message[field])}\n`).join("");
}

export async function verifyBkashWebhook(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const message = input as Record<string, unknown>;
  if (typeof message.Type !== "string" || typeof message.Signature !== "string" || typeof message.SigningCertURL !== "string") return null;
  let certificateUrl: URL;
  try {
    certificateUrl = new URL(message.SigningCertURL);
  } catch {
    return null;
  }
  if (certificateUrl.protocol !== "https:" || !certificateUrl.hostname.endsWith(".amazonaws.com")) return null;
  const certificateResponse = await fetch(certificateUrl, { signal: AbortSignal.timeout(10_000) });
  if (!certificateResponse.ok) return null;
  const certificate = await certificateResponse.text();
  const valid = crypto.verify("RSA-SHA1", Buffer.from(snsStringToSign(message)), certificate, Buffer.from(message.Signature, "base64"));
  return valid ? message : null;
}
import crypto from "node:crypto";
