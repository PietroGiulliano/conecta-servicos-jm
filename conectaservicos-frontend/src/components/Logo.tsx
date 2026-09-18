import { Link } from "react-router-dom";
import { Plug } from "lucide-react";

export function Logo({ to = "/", compact = false }: { to?: string; compact?: boolean }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
        <Plug className="h-5 w-5" aria-hidden />
      </span>
      {!compact ? (
        <span className="text-lg font-extrabold tracking-tight text-ink">
          Conecta<span className="text-primary">Serviços</span>
        </span>
      ) : null}
    </Link>
  );
}
