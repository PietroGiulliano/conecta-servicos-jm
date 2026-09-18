import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { refreshAccessToken, setAccessToken, setSessionExpiredHandler } from "@/api/api";
import { decodeAccessToken } from "@/lib/jwt";
import * as authService from "@/services/auth.service";
import * as providersService from "@/services/providers.service";
import * as companiesService from "@/services/companies.service";
import type { AuthResponse, UserRole } from "@/types/api";

export interface SessionUser {
  id: string;
  role: UserRole;
  /** Nome exibido: vem do perfil da empresa ou do prestador quando disponível. */
  name: string;
  email?: string;
  /** id do ProviderProfile — necessário nas telas do prestador. */
  providerId?: string;
  approvalStatus?: "PENDENTE" | "APROVADO" | "REPROVADO";
}

interface AuthContextValue {
  user: SessionUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  /** true enquanto a sessão está sendo restaurada no boot da aplicação. */
  loading: boolean;
  login: (email: string, password: string) => Promise<UserRole>;
  registerCustomer: (input: authService.RegisterCustomerInput) => Promise<UserRole>;
  registerCompany: (input: authService.RegisterCompanyInput) => Promise<UserRole>;
  registerProvider: (input: authService.RegisterProviderInput) => Promise<UserRole>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Rota inicial de cada papel depois do login/cadastro. */
export function homeRouteFor(role: UserRole): string {
  switch (role) {
    case "EMPRESA":
      return "/empresa/dashboard";
    case "PRESTADOR":
      return "/prestador/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/cliente/dashboard";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  /**
   * O backend responde apenas { accessToken, role } no login. O nome do usuário
   * vem do endpoint de perfil do respectivo papel. Não existe GET /auth/me
   * (ver "Endpoints pendentes" no README) — por isso o fallback pelo papel.
   */
  const loadProfile = useCallback(async (token: string): Promise<SessionUser | null> => {
    const payload = decodeAccessToken(token);
    if (!payload) return null;

    const base: SessionUser = {
      id: payload.sub,
      role: payload.role,
      name: payload.role === "ADMIN" ? "Administração" : "Minha conta",
    };

    try {
      if (payload.role === "EMPRESA") {
        const company = await companiesService.getMine();
        return {
          ...base,
          name: company.tradeName || company.legalName,
          email: company.user?.email,
        };
      }
      if (payload.role === "PRESTADOR") {
        const profile = await providersService.getMyProfile();
        if (profile) {
          return {
            ...base,
            name: profile.professionalName,
            providerId: profile.id,
            approvalStatus: profile.approvalStatus,
          };
        }
      }
    } catch {
      // Perfil indisponível não derruba a sessão: o papel do token já basta
      // para a navegação, e cada tela trata seu próprio erro.
    }
    return base;
  }, []);

  const applySession = useCallback(
    async ({ accessToken, role }: AuthResponse): Promise<UserRole> => {
      setAccessToken(accessToken);
      const profile = await loadProfile(accessToken);
      if (mounted.current) setUser(profile ?? { id: "", role, name: "Minha conta" });
      return role;
    },
    [loadProfile]
  );

  // Restaura a sessão no carregamento usando o cookie httpOnly de refresh.
  useEffect(() => {
    mounted.current = true;
    (async () => {
      const token = await refreshAccessToken();
      if (token) {
        const profile = await loadProfile(token);
        if (mounted.current) setUser(profile);
      }
      if (mounted.current) setLoading(false);
    })();
    return () => {
      mounted.current = false;
    };
  }, [loadProfile]);

  // Sessão expirada de verdade (refresh falhou): limpa o estado local.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setAccessToken(null);
      setUser(null);
    });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => applySession(await authService.login(email, password)),
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = await refreshAccessToken();
    if (!token) return;
    const profile = await loadProfile(token);
    if (mounted.current) setUser(profile);
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      loading,
      login,
      registerCustomer: async (input) => applySession(await authService.registerCustomer(input)),
      registerCompany: async (input) => applySession(await authService.registerCompany(input)),
      registerProvider: async (input) => applySession(await authService.registerProvider(input)),
      logout,
      refreshProfile,
    }),
    [user, loading, login, logout, applySession, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro de AuthProvider.");
  return context;
}
