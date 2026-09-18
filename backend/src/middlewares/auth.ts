import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; role: "CLIENTE" | "EMPRESA" | "PRESTADOR" | "ADMIN" };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autenticado. Faça login para continuar." });
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: "Sessão inválida ou expirada. Faça login novamente." });
  }
}

export function requireRole(...roles: Array<"CLIENTE" | "EMPRESA" | "PRESTADOR" | "ADMIN">) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Não autenticado." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Você não tem permissão para acessar este recurso." });
    }
    return next();
  };
}
