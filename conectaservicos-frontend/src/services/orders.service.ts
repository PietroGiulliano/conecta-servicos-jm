import { api } from "@/api/api";
import type { Order, ServiceRequest } from "@/types/api";

export async function getById(id: string): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${id}`);
  return data;
}

/** Prestador inicia o serviço (exige pagamento aprovado). */
export async function start(orderId: string): Promise<ServiceRequest> {
  const { data } = await api.post<ServiceRequest>(`/orders/${orderId}/start`);
  return data;
}

/**
 * Conclusão do serviço. No backend, quem chama é o CLIENTE/EMPRESA
 * (requireRole("CLIENTE","EMPRESA")) — é essa confirmação que libera o saldo
 * pendente do prestador. O prestador não libera dinheiro.
 */
export async function complete(orderId: string): Promise<{ ok: boolean }> {
  const { data } = await api.post<{ ok: boolean }>(`/orders/${orderId}/complete`);
  return data;
}

/**
 * PENDENTE NO BACKEND — não existe listagem de pedidos por usuário
 * (só GET /orders/:id). Ver "Endpoints pendentes" no README.
 * Esperado: GET /api/orders/mine → Order[] do prestador ou do cliente logado.
 */
export async function listMine(): Promise<Order[]> {
  const { data } = await api.get<Order[]>("/orders/mine");
  return data;
}
