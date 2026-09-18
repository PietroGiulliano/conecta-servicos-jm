import { api } from "@/api/api";
import type { CompanyProfile, ServiceRequest } from "@/types/api";

export async function getMine(): Promise<CompanyProfile> {
  const { data } = await api.get<CompanyProfile>("/companies/me");
  return data;
}

export async function updateMine(
  input: Partial<{
    legalName: string;
    tradeName: string;
    industry: string;
    website: string;
    description: string;
    city: string;
    state: string;
  }>
): Promise<CompanyProfile> {
  const { data } = await api.put<CompanyProfile>("/companies/me", input);
  return data;
}

export async function listMyRequests(): Promise<ServiceRequest[]> {
  const { data } = await api.get<ServiceRequest[]>("/companies/me/requests");
  return data;
}
