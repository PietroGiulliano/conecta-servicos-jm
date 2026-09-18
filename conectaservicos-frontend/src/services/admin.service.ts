import { api } from "@/api/api";
import type {
  AdminDashboard,
  AdminGrowth,
  AdminUser,
  FinancialReport,
  Paginated,
  ProviderOwnProfile,
  UserRole,
  UserStatus,
} from "@/types/api";

export async function dashboard(): Promise<AdminDashboard> {
  const { data } = await api.get<AdminDashboard>("/admin/dashboard");
  return data;
}

export async function growth(): Promise<AdminGrowth> {
  const { data } = await api.get<AdminGrowth>("/admin/dashboard/growth");
  return data;
}

export async function listUsers(params: {
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<AdminUser>> {
  const { data } = await api.get<Paginated<AdminUser>>("/admin/users", { params });
  return data;
}

export async function blockUser(id: string): Promise<AdminUser> {
  const { data } = await api.post<AdminUser>(`/admin/users/${id}/block`);
  return data;
}

export async function unblockUser(id: string): Promise<AdminUser> {
  const { data } = await api.post<AdminUser>(`/admin/users/${id}/unblock`);
  return data;
}

export async function listPendingProviders(): Promise<ProviderOwnProfile[]> {
  const { data } = await api.get<ProviderOwnProfile[]>("/admin/providers/pending");
  return data;
}

export async function approveProvider(id: string): Promise<ProviderOwnProfile> {
  const { data } = await api.post<ProviderOwnProfile>(`/admin/providers/${id}/approve`);
  return data;
}

export async function rejectProvider(id: string): Promise<ProviderOwnProfile> {
  const { data } = await api.post<ProviderOwnProfile>(`/admin/providers/${id}/reject`);
  return data;
}

export async function verifyDocument(id: string): Promise<{ id: string; verified: boolean }> {
  const { data } = await api.post<{ id: string; verified: boolean }>(`/admin/providers/documents/${id}/verify`);
  return data;
}

export async function getCommission(): Promise<number> {
  const { data } = await api.get<{ percent: number }>("/admin/settings/commission");
  return data.percent;
}

export async function setCommission(percent: number): Promise<number> {
  const { data } = await api.put<{ percent: number }>("/admin/settings/commission", { percent });
  return data.percent;
}

export interface FinancialFilters {
  startDate?: string;
  endDate?: string;
  providerId?: string;
  categoryId?: string;
  status?: string;
  method?: string;
}

export async function financialReport(filters: FinancialFilters): Promise<FinancialReport> {
  const { data } = await api.get<FinancialReport>("/admin/reports/financial", { params: filters });
  return data;
}

export interface Dispute {
  id: string;
  orderId: string;
  openedById: string;
  reason: string;
  status: "ABERTA" | "EM_ANALISE" | "RESOLVIDA" | "REJEITADA";
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export async function listDisputes(): Promise<Dispute[]> {
  const { data } = await api.get<Dispute[]>("/admin/disputes");
  return data;
}

export async function resolveDispute(
  id: string,
  input: { resolution: string; status: "RESOLVIDA" | "REJEITADA" }
): Promise<Dispute> {
  const { data } = await api.post<Dispute>(`/admin/disputes/${id}/resolve`, input);
  return data;
}
