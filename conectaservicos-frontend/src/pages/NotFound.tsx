import { Link } from "react-router-dom";
import { Button } from "@/components/ui";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <Logo />
      <h1 className="mt-8 text-3xl font-bold text-ink">Página não encontrada</h1>
      <p className="mt-2 max-w-sm text-slate-600">O endereço acessado não existe ou foi movido.</p>
      <Link to="/" className="mt-6">
        <Button size="lg">Voltar para o início</Button>
      </Link>
    </div>
  );
}
