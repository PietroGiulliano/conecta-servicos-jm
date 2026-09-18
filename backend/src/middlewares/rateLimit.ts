import rateLimit from "express-rate-limit";

// Limite geral da API
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em alguns minutos." },
});

// Limite mais estrito para login/cadastro (mitiga brute-force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Tente novamente em alguns minutos." },
});

// Webhooks recebem alto volume de tentativas do próprio gateway; limite mais alto
export const webhookLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
