import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";

export type AccessTokenPayload = {
  sub: string; // user id
  role: "CLIENTE" | "EMPRESA" | "PRESTADOR" | "ADMIN";
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtAccessExpiresIn as SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AccessTokenPayload;
}

export function signRefreshToken(payload: { sub: string }): string {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn as SignOptions["expiresIn"] });
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.jwtRefreshSecret) as { sub: string };
}

// Usado para armazenar apenas o hash do refresh token no banco (nunca o valor puro)
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
