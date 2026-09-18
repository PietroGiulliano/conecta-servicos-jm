import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  // FRONTEND_URL aceita uma ou várias origens separadas por vírgula (ex.:
  // domínio de produção da Vercel + domínios de preview), sem barra no final.
  ...(() => {
    const urls = (process.env.FRONTEND_URL ?? "http://localhost:5173")
      .split(",")
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean);
    return {
      // Lista completa, usada para validar a origem no CORS.
      frontendUrls: urls,
      // Primeira URL da lista, usada para montar links (emails, redirects).
      frontendUrl: urls[0] ?? "http://localhost:5173",
    };
  })(),
  publicApiUrl: process.env.PUBLIC_API_URL ?? "http://localhost:4000",

  jwtSecret: required("JWT_SECRET"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",

  defaultCommissionPercent: Number(process.env.DEFAULT_COMMISSION_PERCENT ?? 10),

  activePaymentProvider: (process.env.ACTIVE_PAYMENT_PROVIDER ?? "MERCADO_PAGO") as
    | "MERCADO_PAGO"
    | "STRIPE",

  mercadoPago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY ?? "",
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "",
    clientId: process.env.MERCADOPAGO_CLIENT_ID ?? "",
    clientSecret: process.env.MERCADOPAGO_CLIENT_SECRET ?? "",
    oauthRedirectUri: process.env.MERCADOPAGO_OAUTH_REDIRECT_URI ?? "http://localhost:4000/api/providers/payment/mercadopago/callback",
    testToken: process.env.MERCADOPAGO_TEST_TOKEN === "true",
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  },

  uploadDir: process.env.UPLOAD_DIR ?? "./uploads",

  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "ConectaServiços <no-reply@conectaservicos.com>",
  },
};

export function isPaymentProviderConfigured(): boolean {
  if (env.activePaymentProvider === "MERCADO_PAGO") {
    return Boolean(env.mercadoPago.accessToken);
  }
  return Boolean(env.stripe.secretKey);
}
