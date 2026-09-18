import { api } from "@/api/api";
import type { Review } from "@/types/api";

/** Somente CLIENTE, após o serviço estar CONCLUIDO. Duplicidade é barrada pelo backend. */
export async function create(input: { orderId: string; rating: number; comment?: string }): Promise<Review> {
  const { data } = await api.post<Review>("/reviews", input);
  return data;
}
