import { api } from "@/api/api";
import type { Payout, ProviderWallet } from "@/types/api";

export interface WalletResponse {
  wallet: ProviderWallet | null;
  completedOrders: number;
}

export async function getMine(): Promise<WalletResponse> {
  const { data } = await api.get<WalletResponse>("/wallet/me");
  return data;
}

export async function requestPayout(amount: number): Promise<Payout> {
  const { data } = await api.post<Payout>("/wallet/me/payout", { amount });
  return data;
}
