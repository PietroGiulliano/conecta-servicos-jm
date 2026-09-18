import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";
import { homeRouteFor, useAuth } from "@/hooks/useAuth";

const links = [
  { to: "/", label: "Início" },
  { to: "/#como-funciona", label: "Como funciona" },
  { to: "/prestadores", label: "Serviços" },
  { to: "/cadastro/prestador", label: "Seja um prestador" },
  { to: "/cadastro/empresa", label: "Para empresas" },
];

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-ink"
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated && user ? (
              <Button onClick={() => navigate(homeRouteFor(user.role))}>Ir para meu painel</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  Entrar
                </Button>
                <Button onClick={() => navigate("/cadastro")}>Criar conta</Button>
              </>
            )}
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {open ? (
          <div className="border-t border-slate-200 bg-white lg:hidden">
            <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3">
                {isAuthenticated && user ? (
                  <Button className="flex-1" onClick={() => navigate(homeRouteFor(user.role))}>
                    Meu painel
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1" onClick={() => navigate("/login")}>
                      Entrar
                    </Button>
                    <Button className="flex-1" onClick={() => navigate("/cadastro")}>
                      Criar conta
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-slate-500">Conectando quem precisa a quem sabe fazer.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="mb-2 font-semibold text-ink">Para você</p>
              <Link to="/prestadores" className="block py-1 text-slate-600 hover:text-primary">Buscar profissionais</Link>
              <Link to="/cadastro/cliente" className="block py-1 text-slate-600 hover:text-primary">Criar conta</Link>
            </div>
            <div>
              <p className="mb-2 font-semibold text-ink">Para empresas</p>
              <Link to="/cadastro/empresa" className="block py-1 text-slate-600 hover:text-primary">Cadastrar empresa</Link>
            </div>
            <div>
              <p className="mb-2 font-semibold text-ink">Profissionais</p>
              <Link to="/cadastro/prestador" className="block py-1 text-slate-600 hover:text-primary">Quero ser prestador</Link>
              <Link to="/login" className="block py-1 text-slate-600 hover:text-primary">Entrar</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} ConectaServiços
        </div>
      </footer>
    </div>
  );
}
