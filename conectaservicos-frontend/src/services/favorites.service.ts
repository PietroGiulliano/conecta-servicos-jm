import { api } from "@/api/api";
import type { Favorite } from "@/types/api";

export async function list(): Promise<Favorite[]> {
  const { data } = await api.get<Favorite[]>("/favorites");
  return data;
}

export async function add(providerId: string): Promise<Favorite> {
  const { data } = await api.post<Favorite>(`/favorites/${providerId}`);
  return data;
}

export async function remove(providerId: string): Promise<void> {
  await api.delete(`/favorites/${providerId}`);
}
