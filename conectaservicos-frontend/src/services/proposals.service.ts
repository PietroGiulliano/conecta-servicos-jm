import { api } from "@/api/api";
import type { Order, Proposal } from "@/types/api";

export interface CreateProposalInput {
  serviceRequestId: string;
  value: number;
  description: string;
  estimatedDays?: number;
  availableDate?: string; // ISO 8601
  notes?: string;
}

export async function create(input: CreateProposalInput): Promise<Proposal> {
  const { data } = await api.post<Proposal>("/proposals", input);
  return data;
}

/** Aceitar proposta cria o pedido (Order) e devolve o pedido criado. */
export async function accept(proposalId: string): Promise<Order> {
  const { data } = await api.post<Order>(`/proposals/${proposalId}/accept`);
  return data;
}

/**
 * PENDENTE NO BACKEND — não existe rota de listagem das propostas do prestador
 * autenticado. Ver seção "Endpoints pendentes" do README.
 * Esperado: GET /api/proposals/mine → Proposal[] com serviceRequest incluído.
 */
export async function listMine(): Promise<Proposal[]> {
  const { data } = await api.get<Proposal[]>("/proposals/mine");
  return data;
}
