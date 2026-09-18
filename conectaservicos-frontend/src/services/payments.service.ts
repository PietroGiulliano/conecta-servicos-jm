import { api } from "@/api/api";
import type { CheckoutResponse, Payment, PaymentMethod } from "@/types/api";

/** Métodos aceitos pelo checkout do backend (checkoutSchema). */
export type CheckoutMethod = Extract<PaymentMethod, "PIX" | "CARTAO_CREDITO">;

export async function createCheckout(orderId: string, method: CheckoutMethod): Promise<CheckoutResponse> {
  const { data } = await api.post<CheckoutResponse>("/payments/checkout", { orderId, method });
  return data;
}

export async function getById(paymentId: string): Promise<Payment> {
  const { data } = await api.get<Payment>(`/payments/${paymentId}`);
  return data;
}

/** Somente ADMIN. O estorno real é executado no gateway pelo backend. */
export async function refund(paymentId: string, reason: string): Promise<{ success: boolean }> {
  const { data } = await api.post<{ success: boolean }>(`/payments/${paymentId}/refund`, { reason });
  return data;
}
