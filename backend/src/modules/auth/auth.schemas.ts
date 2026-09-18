import { z } from "zod";

export const registerCustomerSchema = z.object({
  name: z.string().min(2, "Informe seu nome completo."),
  email: z.string().email("Informe um email válido."),
  phone: z.string().min(8, "Informe um telefone válido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  city: z.string().min(2, "Informe sua cidade."),
  address: z.object({
    street: z.string().min(2),
    number: z.string().optional(),
    complement: z.string().optional(),
    district: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2).max(2),
    zipCode: z.string().min(8),
  }),
});

export const registerProviderSchema = z.object({
  name: z.string().min(2, "Informe seu nome completo."),
  professionalName: z.string().min(2, "Informe seu nome profissional."),
  email: z.string().email("Informe um email válido."),
  phone: z.string().min(8, "Informe um telefone válido."),
  documentNumber: z.string().min(11, "Informe um CPF ou CNPJ válido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  city: z.string().min(2),
  address: z.object({
    street: z.string().min(2),
    number: z.string().optional(),
    complement: z.string().optional(),
    district: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2).max(2),
    zipCode: z.string().min(8),
  }),
  categoryId: z.string().uuid("Selecione uma categoria válida."),
  specialties: z.array(z.string()).default([]),
  bio: z.string().min(10, "Descreva sua experiência profissional."),
  startingPrice: z.number().nonnegative().default(0),
});


export const registerCompanySchema = z.object({
  name: z.string().min(2, "Informe o nome do responsável."),
  legalName: z.string().min(2, "Informe a razão social."),
  tradeName: z.string().optional(),
  documentNumber: z.string().min(14, "Informe um CNPJ válido."),
  email: z.string().email("Informe um email válido."),
  phone: z.string().min(8, "Informe um telefone válido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  city: z.string().min(2),
  state: z.string().min(2).max(2),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  address: z.object({
    street: z.string().min(2),
    number: z.string().optional(),
    complement: z.string().optional(),
    district: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2).max(2),
    zipCode: z.string().min(8),
  }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Informe sua senha."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
});
