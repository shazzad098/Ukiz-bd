import { useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const NEXT_KEY = "ukix-post-login-next";

export function rememberNext(path: string) {
  try {
    sessionStorage.setItem(NEXT_KEY, path);
  } catch {
    // storage unavailable — fall back to home after login
  }
}

export function consumeNext(): string {
  try {
    const value = sessionStorage.getItem(NEXT_KEY);
    sessionStorage.removeItem(NEXT_KEY);
    if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  } catch {
    // ignore
  }
  return "/";
}

function friendlyError(error: unknown): string {
  const message =
    (error as { message?: string })?.message ||
    (error as { data?: { message?: string } })?.data?.message;
  if (message && !message.startsWith("[")) return message;
  return "Something went wrong. Please try again.";
}

export function useCustomer() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const me = trpc.customer.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 30,
  });

  const goAfterAuth = useCallback(async () => {
    await utils.customer.me.invalidate();
    setLocation(consumeNext());
  }, [setLocation, utils]);

  const loginMut = trpc.customer.login.useMutation({
    onSuccess: async (data) => {
      toast.success(`Welcome back, ${data.customer.name.split(" ")[0]}.`);
      await goAfterAuth();
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  const signupMut = trpc.customer.signup.useMutation({
    onSuccess: async (data) => {
      toast.success(`Welcome to UKIZ-BD, ${data.customer.name.split(" ")[0]}.`);
      await goAfterAuth();
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  const logoutMut = trpc.customer.logout.useMutation({
    onSuccess: async () => {
      await utils.customer.me.invalidate();
      utils.customer.me.setData(undefined, null);
      toast.success("Signed out. See you soon.");
      setLocation("/");
    },
  });

  // Gate an action behind login. Returns true when already logged in (action
  // runs), false when redirected to sign in. Pass `next` to choose where the
  // customer lands after signing in (defaults to current page).
  const requireAuth = useCallback(
    (action?: () => void, next?: string) => {
      if (me.data) {
        action?.();
        return true;
      }
      try {
        rememberNext(next ?? `${window.location.pathname}${window.location.search}`);
      } catch {
        // ignore
      }
      toast.info("Please sign in to continue.", {
        description: "Sign in or create an account — it takes a minute.",
      });
      setLocation("/signin");
      return false;
    },
    [me.data, setLocation]
  );

  return {
    customer: me.data ?? null,
    isAuthenticated: Boolean(me.data),
    isLoading: me.isLoading,
    login: loginMut.mutate,
    loginPending: loginMut.isPending,
    signup: signupMut.mutate,
    signupPending: signupMut.isPending,
    logout: () => logoutMut.mutate(),
    logoutPending: logoutMut.isPending,
    requireAuth,
  };
}
