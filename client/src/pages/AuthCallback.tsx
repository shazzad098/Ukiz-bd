import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import BrandLogo from "@/components/BrandLogo";
import { consumeNext } from "@/lib/customer";
import { getBrowserSupabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const api = trpc.useUtils();
  const googleLogin = trpc.customer.googleLogin.useMutation();
  const handled = useRef(false);
  const loginRef = useRef(googleLogin.mutateAsync);
  loginRef.current = googleLogin.mutateAsync;
  const invalidateMeRef = useRef(api.customer.me.invalidate);
  invalidateMeRef.current = api.customer.me.invalidate;
  const setLocationRef = useRef(setLocation);
  setLocationRef.current = setLocation;
  const [message, setMessage] = useState("Completing secure sign-in…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const finishSignIn = async () => {
      const url = new URL(window.location.href);
      const authError = url.searchParams.get("error") || url.searchParams.get("error_description");
      const code = url.searchParams.get("code");
      window.history.replaceState({}, document.title, "/auth/callback");

      if (authError) throw new Error("Google sign-in was cancelled or could not be completed.");
      const supabase = getBrowserSupabase();
      if (!supabase) throw new Error("Supabase Google sign-in is not configured for this site.");

      let session = null;
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        session = data.session;
      } else {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        session = data.session;
      }
      if (!session?.access_token) throw new Error("Google did not return a valid sign-in session.");

      await loginRef.current({ accessToken: session.access_token });
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      await invalidateMeRef.current();
      setLocationRef.current(consumeNext());
    };

    void finishSignIn().catch(async (error: unknown) => {
      const supabase = getBrowserSupabase();
      await supabase?.auth.signOut({ scope: "local" }).catch(() => undefined);
      const explanation = error instanceof Error && error.message.length < 300
        ? error.message
        : "We could not verify this Google account. Please try again or use your email and password.";
      setMessage(explanation);
      setFailed(true);
    });
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f0e9] px-5 py-12 text-[#151515]">
      <section className="w-full max-w-md rounded-[1.5rem] border border-black/10 bg-[#f8f6f0] p-8 text-center shadow-sm md:p-12">
        <div className="mb-8 flex justify-center"><BrandLogo /></div>
        <div className="eyebrow mb-4">Customer account / Google</div>
        <h1 className="serif text-3xl">{failed ? "Sign-in needs another try." : "One moment."}</h1>
        <p role={failed ? "alert" : "status"} aria-live="polite" className="mt-4 text-sm leading-relaxed text-[#625d55]">{message}</p>
        {!failed && <div className="mx-auto mt-7 h-1.5 w-20 overflow-hidden rounded-full bg-[#e5dfd4]"><div className="h-full w-1/2 animate-pulse rounded-full bg-[#a4824e]" /></div>}
        {failed && <Link href="/signin" className="primary-button dark mt-7">Return to sign in</Link>}
      </section>
    </main>
  );
}
