import crypto from "crypto";
import { Router } from "express";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRole, AuthenticatedRequest } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../middlewares/errorHandler";
import { env } from "../../config/env";
import { encryptSecret } from "../../utils/secret";

const router = Router();

router.get("/mercadopago/connect", requireAuth, requireRole("PRESTADOR"), asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!env.mercadoPago.clientId || !env.mercadoPago.clientSecret) {
    throw new AppError("Mercado Pago OAuth não configurado no servidor.", 503);
  }
  const provider = await prisma.providerProfile.findUnique({ where: { userId: req.user!.id } });
  if (!provider) throw new AppError("Perfil de prestador não encontrado.", 404);

  const rawState = crypto.randomBytes(32).toString("hex");
  const stateHash = crypto.createHash("sha256").update(rawState).digest("hex");
  await prisma.paymentOAuthState.create({ data: { providerId: provider.id, stateHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });

  const url = new URL("https://auth.mercadopago.com/authorization");
  url.searchParams.set("client_id", env.mercadoPago.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("state", rawState);
  url.searchParams.set("redirect_uri", env.mercadoPago.oauthRedirectUri);
  res.json({ authorizationUrl: url.toString() });
}));

router.get("/mercadopago/callback", asyncHandler(async (req, res) => {
  const code = String(req.query.code ?? "");
  const state = String(req.query.state ?? "");
  if (!code || !state) throw new AppError("Autorização do Mercado Pago inválida.", 400);
  if (!env.mercadoPago.clientId || !env.mercadoPago.clientSecret) throw new AppError("OAuth não configurado.", 503);

  const stateHash = crypto.createHash("sha256").update(state).digest("hex");
  const oauthState = await prisma.paymentOAuthState.findUnique({ where: { stateHash } });
  if (!oauthState || oauthState.expiresAt < new Date()) throw new AppError("Estado OAuth expirado ou inválido.", 400);

  const body = new URLSearchParams({
    client_id: env.mercadoPago.clientId,
    client_secret: env.mercadoPago.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.mercadoPago.oauthRedirectUri,
    ...(env.mercadoPago.testToken ? { test_token: "true" } : {}),
  });
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error("[mercadopago oauth]", detail);
    throw new AppError("Não foi possível vincular a conta Mercado Pago.", 502);
  }
  const token = await response.json() as { access_token: string; refresh_token: string; expires_in: number; user_id: number; public_key?: string };

  await prisma.providerProfile.update({
    where: { id: oauthState.providerId },
    data: {
      paymentAccountId: String(token.user_id),
      mpCollectorId: String(token.user_id),
      mpAccessTokenEncrypted: encryptSecret(token.access_token),
      mpRefreshTokenEncrypted: encryptSecret(token.refresh_token),
      mpTokenExpiresAt: new Date(Date.now() + Number(token.expires_in ?? 15552000) * 1000),
      mpPublicKey: token.public_key,
    },
  });
  await prisma.paymentOAuthState.delete({ where: { id: oauthState.id } });
  res.redirect(`${env.frontendUrl}/prestador/pagamentos?mercadopago=connected`);
}));

router.get("/status", requireAuth, requireRole("PRESTADOR"), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const provider = await prisma.providerProfile.findUnique({ where: { userId: req.user!.id }, select: { paymentAccountId: true, mpTokenExpiresAt: true } });
  if (!provider) throw new AppError("Perfil de prestador não encontrado.", 404);
  res.json({ connected: Boolean(provider.paymentAccountId), expiresAt: provider.mpTokenExpiresAt });
}));

export default router;
