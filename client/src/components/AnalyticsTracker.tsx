import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const SESSION_KEY = "ukiz-analytics-session";

function getSessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return undefined;
  }
}

export default function AnalyticsTracker() {
  const [pathname] = useLocation();
  const { mutate } = trpc.analytics.track.useMutation();

  useEffect(() => {
    mutate({
      event: "page_view",
      path: pathname,
      sessionId: getSessionId(),
      referrer: document.referrer || undefined,
    });
  }, [mutate, pathname]);

  useEffect(() => {
    const report = (message: string) => {
      mutate({
        event: "client_error",
        path: window.location.pathname,
        sessionId: getSessionId(),
        metadata: { message: message.slice(0, 500) },
      });
    };
    const onError = (event: ErrorEvent) => report(event.message || "Unhandled client error");
    const onRejection = (event: PromiseRejectionEvent) => report(String(event.reason ?? "Unhandled promise rejection"));
    const onBoundaryError = (event: Event) => report(String((event as CustomEvent<{ message?: string }>).detail?.message ?? "React render error"));
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("ukiz:client-error", onBoundaryError);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("ukiz:client-error", onBoundaryError);
    };
  }, [mutate]);

  return null;
}
