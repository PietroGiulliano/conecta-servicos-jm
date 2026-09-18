import { AxiosError } from "axios";

/**
 * Converte qualquer erro em uma mensagem amigável. O backend responde
 * { error: "..." } (AppError/errorHandler) ou { error, issues } para falhas de
 * validação Zod. Nunca expomos status HTTP cru, AxiosError ou stack trace.
 */
export function getErrorMessage(error: unknown, fallback = "Não foi possível concluir a ação. Tente novamente."): string {
  if (error instanceof AxiosError) {
    if (error.code === "ERR_NETWORK") {
      return "Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.";
    }
    const data = error.response?.data as
      | { error?: string; message?: string; issues?: { path?: (string | number)[]; message?: string }[] }
      | undefined;

    if (data?.issues?.length) {
      const first = data.issues[0];
      if (first?.message) return first.message;
    }
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.message === "string") return data.message;

    const status = error.response?.status;
    if (status === 403) return "Você não tem permissão para esta ação.";
    if (status === 404) return "Não encontramos o que você procura.";
    if (status === 429) return "Muitas tentativas em pouco tempo. Aguarde um instante.";
    if (status && status >= 500) return "O servidor não conseguiu responder agora. Tente novamente em instantes.";
  }
  return fallback;
}

/** true quando a rota chamada ainda não existe no backend (ver README). */
export function isMissingEndpoint(error: unknown): boolean {
  return error instanceof AxiosError && (error.response?.status === 404 || error.response?.status === 501);
}
