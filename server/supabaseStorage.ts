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

// Magic-byte sniffing: the client-declared MIME is never trusted on its own,
// otherwise a script/polyglot file could be stored and served as an image.
export function sniffImageKind(data: Buffer): "jpeg" | "png" | "webp" | "gif" | null {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "jpeg";
  if (
    data.length >= 8 &&
    data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47 &&
    data[4] === 0x0d && data[5] === 0x0a && data[6] === 0x1a && data[7] === 0x0a
  )
    return "png";
  if (
    data.length >= 12 &&
    data.toString("ascii", 0, 4) === "RIFF" &&
    data.toString("ascii", 8, 12) === "WEBP"
  )
    return "webp";
  if (
    data.length >= 6 &&
    data.toString("ascii", 0, 3) === "GIF" &&
    (data.toString("ascii", 3, 6) === "87a" || data.toString("ascii", 3, 6) === "89a")
  )
    return "gif";
  return null;
}

const KIND_TO_MIME = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" } as const;

/** Upload a product image buffer to Supabase Storage. Returns the public URL. */
export async function uploadProductImage(
  data: Buffer,
  contentType: string,
  originalName: string
): Promise<string> {
  if (!ALLOWED_MIME.has(contentType)) throw new Error("Only JPG, PNG, WEBP or GIF images are allowed.");
  if (data.length === 0 || data.length > MAX_BYTES) throw new Error("Image must be smaller than 5MB.");
  const kind = sniffImageKind(data);
  if (!kind || KIND_TO_MIME[kind] !== contentType) {
    throw new Error("File content does not match its image type.");
  }
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
