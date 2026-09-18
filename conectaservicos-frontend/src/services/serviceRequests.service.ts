import { api } from "@/api/api";
import type { ServiceRequest } from "@/types/api";

export interface CreateServiceRequestInput {
  categoryId: string;
  title: string;
  description: string;
  photos?: string[];
  addressId?: string;
  city: string;
  desiredDate?: string; // ISO 8601
  desiredTime?: string;
  approxBudget?: number;
  targetProviderId?: string;
}

export async function create(input: CreateServiceRequestInput): Promise<ServiceRequest> {
  const { data } = await api.post<ServiceRequest>("/service-requests", input);
  return data;
}

/** Solicitações do cliente/empresa autenticado. */
export async function listMine(): Promise<ServiceRequest[]> {
  const { data } = await api.get<ServiceRequest[]>("/service-requests/mine");
  return data;
}

/** Oportunidades compatíveis com o perfil do prestador autenticado. */
export async function listAvailable(): Promise<ServiceRequest[]> {
  const { data } = await api.get<ServiceRequest[]>("/service-requests/available");
  return data;
}

export async function getById(id: string): Promise<ServiceRequest> {
  const { data } = await api.get<ServiceRequest>(`/service-requests/${id}`);
  return data;
}

export async function cancel(id: string): Promise<ServiceRequest> {
  const { data } = await api.post<ServiceRequest>(`/service-requests/${id}/cancel`);
  return data;
}
