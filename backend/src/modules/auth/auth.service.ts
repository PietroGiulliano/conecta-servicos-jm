import crypto from "crypto";
import { prisma } from "../../config/prisma";
import { hashPassword, verifyPassword } from "../../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from "../../utils/jwt";
import { AppError } from "../../middlewares/errorHandler";
import { sendEmail, buildPasswordResetEmail } from "../../utils/mailer";
import { env } from "../../config/env";
import {
  registerCustomerSchema,
  registerProviderSchema,
  registerCompanySchema,
  loginSchema,
} from "./auth.schemas";
import { z } from "zod";

const PASSWORD_RESET_EXPIRES_MS = 60 * 60 * 1000; // 1 hora

type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
type RegisterProviderInput = z.infer<typeof registerProviderSchema>;
type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;
type LoginInput = z.infer<typeof loginSchema>;

async function ensureEmailAvailable(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("Este email já está cadastrado.", 409);
  }
}

export async function registerCustomer(input: RegisterCustomerInput) {
  await ensureEmailAvailable(input.email);
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: "CLIENTE",
      customerProfile: { create: { city: input.city } },
      addresses: { create: { ...input.address, label: "principal" } },
    },
    include: { customerProfile: true },
  });

  return issueSession(user.id, "CLIENTE");
}

export async function registerCompany(input: RegisterCompanyInput) {
  await ensureEmailAvailable(input.email);
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: "EMPRESA",
      customerProfile: { create: { city: input.city } },
      companyProfile: {
        create: {
          legalName: input.legalName,
          tradeName: input.tradeName,
          documentNumber: input.documentNumber,
          city: input.city,
          state: input.state,
          industry: input.industry,
          website: input.website,
          description: input.description,
        },
      },
      addresses: { create: { ...input.address, label: "principal" } },
    },
    include: { companyProfile: true, customerProfile: true },
  });

  return issueSession(user.id, "EMPRESA");
}

export async function registerProvider(input: RegisterProviderInput) {
  await ensureEmailAvailable(input.email);
  const passwordHash = await hashPassword(input.password);

  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) throw new AppError("Categoria inválida.", 422);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: "PRESTADOR",
      status: "PENDENTE_VERIFICACAO",
      addresses: { create: { ...input.address, label: "principal" } },
      providerProfile: {
        create: {
          professionalName: input.professionalName,
          documentNumber: input.documentNumber,
          categoryId: input.categoryId,
          specialties: input.specialties,
          bio: input.bio,
          startingPrice: input.startingPrice,
          citiesServed: [input.city],
          approvalStatus: "PENDENTE",
          wallet: { create: {} },
        },
      },
    },
    include: { providerProfile: true },
  });

  return issueSession(user.id, "PRESTADOR");
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new AppError("Email ou senha inválidos.", 401);

  const valid = await verifyPassword(user.passwordHash, input.password);
  if (!valid) throw new AppError("Email ou senha inválidos.", 401);

  if (user.status === "BLOQUEADO") {
    throw new AppError("Sua conta foi bloqueada. Contate o suporte.", 403);
  }

  return issueSession(user.id, user.role);
}

async function issueSession(userId: string, role: "CLIENTE" | "EMPRESA" | "PRESTADOR" | "ADMIN") {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = signRefreshToken({ sub: userId });

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken, role };
}

export async function refreshSession(refreshToken: string) {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Sessão expirada. Faça login novamente.", 401);
  }

  const stored = await prisma.refreshToken.findFirst({
    where: { userId: payload.sub, tokenHash: hashToken(refreshToken), revoked: false },
  });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError("Sessão expirada. Faça login novamente.", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new AppError("Usuário não encontrado.", 401);

  // rotação: revoga o token antigo e emite um novo par
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  return issueSession(user.id, user.role);
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken) },
    data: { revoked: true },
  });
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Não revela se o email existe ou não (evita enumeração de contas)
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRES_MS),
    },
  });

  const resetUrl = `${env.frontendUrl}/redefinir-senha?token=${token}`;
  const { subject, text, html } = buildPasswordResetEmail(resetUrl);
  await sendEmail({ to: user.email, subject, text, html });
}

export async function resetPassword(token: string, newPassword: string) {
  const stored = await prisma.passwordResetToken.findFirst({
    where: { tokenHash: hashToken(token), usedAt: null },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError("Link de redefinição inválido ou expirado. Solicite um novo.", 400);
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } }),
    // Por segurança, invalida todas as sessões ativas ao trocar a senha.
    prisma.refreshToken.updateMany({ where: { userId: stored.userId }, data: { revoked: true } }),
  ]);
}
