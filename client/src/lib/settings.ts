import { trpc } from "@/lib/trpc";
import { FREE_DELIVERY_THRESHOLD, MERCHANT_SEND_MONEY_NUMBER } from "@shared/order";

export const DEFAULT_SETTINGS = {
  announcement: "Complimentary delivery over ৳3,000 ✳ Authenticity, always ✳ Small-batch edits / big presence",
  merchantNumber: MERCHANT_SEND_MONEY_NUMBER,
  supportEmail: "ukizbdofficial@gmail.com",
  supportPhone: "",
  freeThreshold: FREE_DELIVERY_THRESHOLD,
};

export function usePublicSettings() {
  const query = trpc.settings.public.useQuery(undefined, {
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
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
