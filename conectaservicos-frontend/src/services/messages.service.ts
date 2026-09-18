import { api } from "@/api/api";
import type { Message } from "@/types/api";

/** O chat é por solicitação de serviço: cliente x prestadores envolvidos. */
export async function list(serviceRequestId: string): Promise<Message[]> {
  const { data } = await api.get<Message[]>(`/messages/${serviceRequestId}`);
  return data;
}

export async function send(serviceRequestId: string, content: string): Promise<Message> {
  const { data } = await api.post<Message>(`/messages/${serviceRequestId}`, { content });
  return data;
}

export async function markAsRead(serviceRequestId: string): Promise<void> {
  await api.post(`/messages/${serviceRequestId}/read`);
}
