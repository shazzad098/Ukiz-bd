import { trpc } from "@/lib/trpc";

export function useActiveDeals() {
  return trpc.coupons.activeDeals.useQuery(undefined, {
    staleTime: 0,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}
