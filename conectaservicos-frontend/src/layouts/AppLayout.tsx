import { useMemo, useState, type ComponentType } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  CreditCard,
  FileText,
  Handshake,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Search,
  Wallet,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/utils/format";
import type { UserRole } from "@/types/api";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Itens marcados aparecem também na barra inferior do celular. */
  mobile?: boolean;
}

const navByRole: Record<Exclude<UserRole, "ADMIN">, NavItem[]> = {
  CLIENTE: [
    { to: "/cliente/dashboard", label: "Painel", icon: LayoutDashboard, mobile: true },
    { to: "/cliente/solicitacoes", label: "Minhas solicitações", icon: FileText, mobile: true },
    { to: "/prestadores", label: "Buscar profissionais", icon: Search, mobile: true },
    { to: "/chat", label: "Mensagens", icon: MessageSquare, mobile: true },
  ],
  EMPRESA: [
    { to: "/empresa/dashboard", label: "Painel", icon: LayoutDashboard, mobile: true },
    { to: "/empresa/solicitacoes", label: "Solicitações", icon: FileText, mobile: true },
    { to: "/prestadores", label: "Profissionais", icon: Search, mobile: true },
    { to: "/chat", label: "Mensagens", icon: MessageSquare, mobile: true },
  ],
  PRESTADOR: [
    { to: "/prestador/dashboard", label: "Painel", icon: LayoutDashboard, mobile: true },
    { to: "/prestador/oportunidades", label: "Oportunidades", icon: Briefcase, mobile: true },
    { to: "/prestador/propostas", label: "Minhas propostas", icon: Handshake },
    { to: "/prestador/servicos", label: "Meus serviços", icon: FileText, mobile: true },
    { to: "/prestador/carteira", label: "Carteira", icon: Wallet },
    { to: "/prestador/pagamentos", label: "Recebimentos", icon: CreditCard },
    { to: "/chat", label: "Mensagens", icon: MessageSquare, mobile: true },
  ],
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const role = (user?.role ?? "CLIENTE") as Exclude<UserRole, "ADMIN">;
  const items = useMemo(() => navByRole[role] ?? navByRole.CLIENTE, [role]);
  const mobileItems = items.filter((item) => item.mobile).slice(0, 4);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-100 px-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <SideLink key={item.to} item={item} />
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-ink"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sair
          </button>
        </div>
      </aside>

      {/* Drawer — celular/tablet */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawerOpen(false)} aria-hidden />
          <div className="relative flex h-full w-72 max-w-[80%] flex-col bg-white shadow-pop">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
              <Logo />
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Fechar menu" className="p-2 text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3" onClick={() => setDrawerOpen(false)}>
              {items.map((item) => (
                <SideLink key={item.to} item={item} />
              ))}
            </nav>
            <div className="border-t border-slate-100 p-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sair
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <p className="truncate text-sm font-semibold text-ink lg:text-base">
              {items.find((item) => location.pathname.startsWith(item.to))?.label ?? "ConectaServiços"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell enabled={Boolean(user)} />
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 py-1 pl-1 pr-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
                {initials(user?.name)}
              </span>
              <span className="hidden max-w-[10rem] truncate text-sm font-medium text-ink sm:block">{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Barra inferior — celular */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white lg:hidden">
        <div className="mx-auto flex max-w-lg">
          {mobileItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? "text-primary" : "text-slate-500"
                }`
              }
            >
              <item.icon className="h-5 w-5" aria-hidden />
              {item.label.split(" ")[0]}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function SideLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive ? "bg-primary-light text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
        }`
      }
    >
      <item.icon className="h-4 w-4" aria-hidden />
      {item.label}
    </NavLink>
  );
}
