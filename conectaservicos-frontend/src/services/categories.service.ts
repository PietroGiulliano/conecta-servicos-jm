import { api } from "@/api/api";
import type { Category } from "@/types/api";

export async function list(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function create(input: { name: string; slug: string; iconKey?: string }): Promise<Category> {
  const { data } = await api.post<Category>("/categories", input);
  return data;
}

export async function update(id: string, input: Partial<{ name: string; slug: string; iconKey: string }>): Promise<Category> {
  const { data } = await api.put<Category>(`/categories/${id}`, input);
  return data;
}

export async function deactivate(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}
