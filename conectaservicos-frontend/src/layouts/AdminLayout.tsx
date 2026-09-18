import { useState, type ComponentType } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Building2,
  CreditCard,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  Percent,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";

const items: { to: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/prestadores", label: "Prestadores", icon: Wrench },
  { to: "/admin/empresas", label: "Empresas", icon: Building2 },
  { to: "/admin/pagamentos", label: "Pagamentos e comissões", icon: CreditCard },
  { to: "/admin/comissoes", label: "Comissão da plataforma", icon: Percent },
  { to: "/admin/denuncias", label: "Denúncias", icon: Flag },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`
          }
        >
          <item.icon className="h-4 w-4" aria-hidden />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-ink lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-sm font-bold uppercase tracking-wide text-white">Administração</span>
        </div>
        {nav}
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sair
          </button>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative flex h-full w-72 max-w-[80%] flex-col bg-ink">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <span className="text-sm font-bold uppercase tracking-wide text-white">Administração</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu" className="p-2 text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-lg p-2 text-slate-600 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
              <Menu className="h-6 w-6" />
            </button>
            <p className="text-sm font-semibold text-ink">Painel administrativo</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell enabled={Boolean(user)} />
            <span className="hidden text-sm text-slate-500 sm:block">{user?.name}</span>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
