import { api } from "@/api/api";
import type {
  Paginated,
  ProviderCard,
  ProviderDocument,
  ProviderOwnProfile,
  ProviderPaymentStatus,
  ProviderPublicProfile,
} from "@/types/api";

export interface SearchParams {
  categorySlug?: string;
  city?: string;
  minRating?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

export async function search(params: SearchParams): Promise<Paginated<ProviderCard>> {
  const { data } = await api.get<Paginated<ProviderCard>>("/providers", { params });
  return data;
}

export async function getById(id: string): Promise<ProviderPublicProfile> {
  const { data } = await api.get<ProviderPublicProfile>(`/providers/${id}`);
  return data;
}

export async function getMyProfile(): Promise<ProviderOwnProfile | null> {
  const { data } = await api.get<ProviderOwnProfile | null>("/providers/me/profile");
  return data;
}

export interface UpdateProfileInput {
  professionalName?: string;
  bio?: string;
  specialties?: string[];
  citiesServed?: string[];
  serviceRadiusKm?: number;
  startingPrice?: number;
  photoUrl?: string;
}

export async function updateMyProfile(input: UpdateProfileInput): Promise<ProviderOwnProfile> {
  const { data } = await api.put<ProviderOwnProfile>("/providers/me/profile", input);
  return data;
}

export async function addDocument(input: { type: string; fileUrl: string }): Promise<ProviderDocument> {
  const { data } = await api.post<ProviderDocument>("/providers/me/documents", input);
  return data;
}

// ── Mercado Pago (OAuth do prestador) ───────────────────────────────────────
export async function getPaymentStatus(): Promise<ProviderPaymentStatus> {
  const { data } = await api.get<ProviderPaymentStatus>("/providers/payment/status");
  return data;
}

export async function getMercadoPagoAuthorizationUrl(): Promise<string> {
  const { data } = await api.get<{ authorizationUrl: string }>("/providers/payment/mercadopago/connect");
  return data.authorizationUrl;
}
