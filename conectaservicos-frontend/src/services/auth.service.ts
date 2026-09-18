import { api } from "@/api/api";
import type { AddressInput, AuthResponse } from "@/types/api";

export interface RegisterCustomerInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  city: string;
  address: AddressInput;
}

export interface RegisterCompanyInput {
  name: string;
  legalName: string;
  tradeName?: string;
  documentNumber: string;
  email: string;
  phone: string;
  password: string;
  city: string;
  state: string;
  industry?: string;
  website?: string;
  description?: string;
  address: AddressInput;
}

export interface RegisterProviderInput {
  name: string;
  professionalName: string;
  email: string;
  phone: string;
  documentNumber: string;
  password: string;
  city: string;
  address: AddressInput;
  categoryId: string;
  specialties: string[];
  bio: string;
  startingPrice: number;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function registerCustomer(input: RegisterCustomerInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register/cliente", input);
  return data;
}

export async function registerCompany(input: RegisterCompanyInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register/empresa", input);
  return data;
}

export async function registerProvider(input: RegisterProviderInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register/prestador", input);
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post("/auth/reset-password", { token, newPassword });
}
