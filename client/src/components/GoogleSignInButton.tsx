import { useState } from "react";
import { toast } from "sonner";
import { beginGoogleSignIn } from "@/lib/supabase";
import { rememberNext } from "@/lib/customer";

export default function GoogleSignInButton({ label = "Continue with Google", nextPath }: { label?: string; nextPath?: string }) {
  const [pending, setPending] = useState(false);

  const start = async () => {
    setPending(true);
    try {
      if (nextPath) rememberNext(nextPath);
      await beginGoogleSignIn();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sign-in could not start.";
      toast.error(message);
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void start()}
      disabled={pending}
      className="mt-4 flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-black/15 bg-white px-5 text-sm font-semibold text-[#222] transition-colors hover:border-black/35 hover:bg-[#f3f0e9] disabled:cursor-wait disabled:opacity-60"
    >
      <span aria-hidden="true" className="serif text-lg font-bold text-[#4285f4]">G</span>
      {pending ? "Connecting to Google…" : label}
    </button>
  );
}
