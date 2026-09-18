import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL;

if (!rawApiUrl) {
  // CAUSA RAIZ do erro "(t.data ?? []).map is not a function" em produção:
  // se VITE_API_URL não estiver definida (ex.: variável não configurada no
  // projeto da Vercel), baseURL cairia para "/api" — uma URL relativa ao
  // próprio domínio da Vercel. O vercel.json tem um rewrite catch-all
  // ("/(.*)" -> "/index.html") que intercepta ESSA MESMA requisição e
  // devolve o HTML da SPA com status 200. O axios recebe uma string HTML
  // no lugar do array JSON esperado, e "(dados ?? []).map" quebra porque
  // uma string não tem .map. Por isso falhamos alto e claro aqui, em vez
  // de deixar a chamada seguir para uma URL relativa silenciosamente.
  throw new Error(
    "VITE_API_URL não definida. Configure essa variável de ambiente " +
      "(no .env local, ou nas Environment Variables do projeto na Vercel " +
      "em produção) apontando para a URL pública do backend no Render, " +
      "ex.: https://seu-backend.onrender.com (sem /api no final)."
  );
}

const baseURL = `${rawApiUrl.replace(/\/+$/, "")}/api`;

export const api: AxiosInstance = axios.create({
  baseURL,
  // necessário para o cookie httpOnly cs_refresh_token usado em /auth/refresh
  withCredentials: true,
  timeout: 20000,
});

// Guarda de sanidade: se algum dia a API responder algo que não seja JSON
// (por exemplo, HTML de uma página de erro ou de um rewrite mal configurado),
// falhamos com uma mensagem clara em vez de deixar o componente quebrar com
// um TypeError obscuro do tipo "(dados ?? []).map is not a function".
api.interceptors.response.use((response) => {
  const contentType = String(response.headers?.["content-type"] ?? "");
  if (typeof response.data === "string" && contentType.includes("text/html")) {
    throw new Error(
      `Resposta inesperada (HTML) de ${response.config?.url}. ` +
        "Verifique VITE_API_URL, o CORS do backend e o rewrite do vercel.json."
    );
  }
  return response;
});

// ── Token de acesso: mantido apenas em memória ───────────────────────────────
// A sessão sobrevive ao reload através do refresh token em cookie httpOnly,
// que o JavaScript não consegue ler. Nada sensível vai para o localStorage.
let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

// ── Refresh automático em 401 ────────────────────────────────────────────────
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = axios
      .post<{ accessToken: string; role: string }>(
        `${baseURL}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .then((res) => {
        accessToken = res.data.accessToken;
        return accessToken;
      })
      .catch(() => {
        accessToken = null;
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export { refreshAccessToken };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthRoute = original?.url?.includes("/auth/");

    if (error.response?.status === 401 && original && !original._retried && !isAuthRoute) {
      original._retried = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers.set("Authorization", `Bearer ${token}`);
        return api(original);
      }
      onSessionExpired?.();
    }
    return Promise.reject(error);
  }
);
