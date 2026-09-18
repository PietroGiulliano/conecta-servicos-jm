import type { UserRole } from "@/types/api";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  exp?: number;
}

/**
 * Lê o payload do access token apenas para saber id e papel do usuário na
 * navegação. A assinatura NUNCA é validada aqui: quem autoriza é o backend.
 */
export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(decodeURIComponent(escape(json))) as AccessTokenPayload;
    if (!parsed?.sub || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}
