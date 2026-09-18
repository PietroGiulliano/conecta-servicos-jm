import { api } from "@/api/api";
import type { Notification } from "@/types/api";

export async function list(): Promise<Notification[]> {
  const { data } = await api.get<Notification[]>("/notifications");
  return data;
}

export async function markAsRead(id: string): Promise<{ updated: number }> {
  const { data } = await api.post<{ updated: number }>(`/notifications/${id}/read`);
  return data;
}
