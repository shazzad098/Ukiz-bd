import { trpc } from "@/lib/trpc";
import { FREE_DELIVERY_THRESHOLD } from "@shared/order";

export const DEFAULT_SETTINGS = {
  announcement: "",
  merchantNumber: "",
  supportEmail: "",
  supportPhone: "",
  freeThreshold: FREE_DELIVERY_THRESHOLD,
};

export function usePublicSettings() {
  const query = trpc.settings.public.useQuery(undefined, {
    staleTime: 0,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
  const data = query.data;
  return {
    announcement: data?.announcement || DEFAULT_SETTINGS.announcement,
    merchantNumber: data?.merchantNumber || DEFAULT_SETTINGS.merchantNumber,
    supportEmail: data?.supportEmail || DEFAULT_SETTINGS.supportEmail,
    supportPhone: data?.supportPhone ?? "",
    freeThreshold: Number(data?.freeThreshold) || DEFAULT_SETTINGS.freeThreshold,
    isLoading: query.isLoading,
  };
}
