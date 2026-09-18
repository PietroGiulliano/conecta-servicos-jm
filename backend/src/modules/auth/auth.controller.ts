import { Request, Response } from "express";
import {
  registerCustomerSchema,
  registerProviderSchema,
  registerCompanySchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schemas";
import * as authService from "./auth.service";

const REFRESH_COOKIE = "cs_refresh_token";
const isProd = process.env.NODE_ENV === "production";
// Em produção, frontend (Vercel) e backend (Render) ficam em domínios
// diferentes — isso é uma requisição "cross-site" do ponto de vista do
// navegador. Cookies com SameSite=Lax NÃO são enviados em chamadas
// fetch/XHR cross-site (só em navegações de topo), então o refresh token
// nunca chegaria ao backend e o usuário seria deslogado a cada reload.
// SameSite=None exige Secure=true, por isso os dois andam juntos aqui.
// Em desenvolvimento local (mesmo domínio "localhost", portas diferentes)
// "lax" funciona normalmente e evita exigir HTTPS local.
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
};

export async function registerCustomer(req: Request, res: Response) {
  const input = registerCustomerSchema.parse(req.body);
  const { accessToken, refreshToken, role } = await authService.registerCustomer(input);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.status(201).json({ accessToken, role });
}

export async function registerCompany(req: Request, res: Response) {
  const input = registerCompanySchema.parse(req.body);
  const { accessToken, refreshToken, role } = await authService.registerCompany(input);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.status(201).json({ accessToken, role });
}

export async function registerProvider(req: Request, res: Response) {
  const input = registerProviderSchema.parse(req.body);
  const { accessToken, refreshToken, role } = await authService.registerProvider(input);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.status(201).json({ accessToken, role });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const { accessToken, refreshToken, role } = await authService.login(input);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.json({ accessToken, role });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) return res.status(401).json({ error: "Sessão não encontrada." });
  const { accessToken, refreshToken, role } = await authService.refreshSession(token);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.json({ accessToken, role });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, { path: "/", secure: isProd, sameSite: isProd ? "none" : "lax" });
  res.status(204).send();
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = forgotPasswordSchema.parse(req.body);
  await authService.requestPasswordReset(email);
  res.json({ message: "Se o email existir em nossa base, você receberá instruções de redefinição." });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = resetPasswordSchema.parse(req.body);
  await authService.resetPassword(token, newPassword);
  res.json({ message: "Senha redefinida com sucesso. Faça login com a nova senha." });
}
