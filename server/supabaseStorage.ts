import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

let _client: SupabaseClient | null = null;
let _bucketReady = false;

function getClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  // Service-role key stays server-side only and bypasses storage RLS,
  // so no dashboard bucket policies are needed.
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  if (!_client) _client = createClient(url, key);
  return _client;
}

export function isStorageConfigured(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_KEY;
}

async function ensureBucket(client: SupabaseClient): Promise<void> {
  if (_bucketReady) return;
  const { error } = await client.storage.createBucket(BUCKET, { public: true });
  // "already exists" (and race duplicates) are fine — anything else throws.
  if (error && !/already exists|duplicate|conflict/i.test(error.message)) throw new Error(error.message);
  _bucketReady = true;
}

function extFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

/** Upload a product image buffer to Supabase Storage. Returns the public URL. */
export async function uploadProductImage(
  data: Buffer,
  contentType: string,
  originalName: string
): Promise<string> {
  if (!ALLOWED_MIME.has(contentType)) throw new Error("Only JPG, PNG, WEBP or GIF images are allowed.");
  if (data.length === 0 || data.length > MAX_BYTES) throw new Error("Image must be smaller than 5MB.");
  const client = getClient();
  if (!client) {
    throw new Error(
      "Image storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY on the server to enable device uploads (URL paste still works)."
    );
  }
  await ensureBucket(client);
  const safe = originalName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(-60) || "image";
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}.${extFor(contentType)}`;
  const { error } = await client.storage.from(BUCKET).upload(path, data, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data: publicData } = client.storage.from(BUCKET).getPublicUrl(path);
  return publicData.publicUrl;
}
