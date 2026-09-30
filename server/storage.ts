import { uploadProductImage } from "./supabaseStorage";

/**
 * Platform storage shim. `server/_core/imageGeneration.ts` imports
 * `storagePut` from the `server/storage` path; this implementation backs it
 * with Supabase Storage so type-checking passes and the helper stays usable.
 */
export async function storagePut(
  path: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ url: string }> {
  const name = path.split("/").pop() || "file";
  const url = await uploadProductImage(buffer, mimeType, name);
  return { url };
}
