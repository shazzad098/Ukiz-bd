import { createClient, type User } from "@supabase/supabase-js";

export class SupabaseAuthNotConfiguredError extends Error {}
export class SupabaseAuthRejectedError extends Error {}
export class SupabaseAuthUnavailableError extends Error {}

export type VerifiedGoogleIdentity = {
  subject: string;
  email: string;
  name: string | null;
};

function metadataString(metadata: unknown, keys: string[]): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const record = metadata as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function googleIdentityFromUser(user: User): VerifiedGoogleIdentity {
  const appMetadata = user.app_metadata as Record<string, unknown>;
  const declaredProviders = Array.isArray(appMetadata.providers)
    ? appMetadata.providers.filter((provider): provider is string => typeof provider === "string")
    : [];
  const identityProviders = (user.identities ?? []).map(identity => identity.provider);
  const providers = [appMetadata.provider, ...declaredProviders, ...identityProviders];
  if (!providers.includes("google")) throw new SupabaseAuthRejectedError("Google provider required");

  const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
  if (!email || !(user.email_confirmed_at || user.confirmed_at)) {
    throw new SupabaseAuthRejectedError("A verified Google email is required");
  }

  return {
    subject: user.id,
    email,
    name: metadataString(user.user_metadata, ["full_name", "name", "display_name"]),
  };
}

let supabaseAuthClient: ReturnType<typeof createClient> | null = null;
function getSupabaseAuthClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) throw new SupabaseAuthNotConfiguredError("Supabase Auth needs SUPABASE_URL and SUPABASE_ANON_KEY");
  if (!supabaseAuthClient) {
    try {
      supabaseAuthClient = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
    } catch {
      throw new SupabaseAuthNotConfiguredError("Supabase Auth configuration is invalid");
    }
  }
  return supabaseAuthClient;
}

/** Validates the bearer token against Supabase Auth before trusting any claims. */
export async function verifyGoogleAccessToken(accessToken: string): Promise<VerifiedGoogleIdentity> {
  let client: ReturnType<typeof createClient>;
  try {
    client = getSupabaseAuthClient();
  } catch (error) {
    if (error instanceof SupabaseAuthNotConfiguredError) throw error;
    throw new SupabaseAuthNotConfiguredError();
  }
  try {
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) throw new SupabaseAuthRejectedError("Invalid Supabase access token");
    return googleIdentityFromUser(data.user);
  } catch (error) {
    if (error instanceof SupabaseAuthRejectedError) throw error;
    throw new SupabaseAuthUnavailableError("Supabase Auth could not be reached");
  }
}
