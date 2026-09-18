import { Link } from "react-router-dom";
import { ArrowRight, Building2, User, Wrench } from "lucide-react";
import { Card } from "@/components/ui";
import { Logo } from "@/components/Logo";

const options = [
  {
    to: "/cadastro/cliente",
    icon: User,
    title: "Cliente",
    description: "Quero contratar serviços.",
  },
  {
    to: "/cadastro/empresa",
    icon: Building2,
    title: "Empresa",
    description: "Quero contratar profissionais para minha empresa.",
  },
  {
    to: "/cadastro/prestador",
    icon: Wrench,
    title: "Prestador",
    description: "Quero oferecer meus serviços.",
  },
];

export default function RegisterChoice() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <Logo />
      <h1 className="mt-8 text-center text-2xl font-bold text-ink sm:text-3xl">
        Como você deseja usar o ConectaServiços?
      </h1>
      <p className="mt-2 text-center text-sm text-slate-500">Escolha o tipo de conta para começar.</p>

      <div className="mt-8 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {options.map((option) => (
          <Link
            key={option.to}
            to={option.to}
            className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
          >
            <Card className="h-full p-6 transition group-hover:border-primary group-hover:shadow-pop">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
                <option.icon className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-ink">{option.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{option.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Continuar
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm text-slate-600">
        Já tem uma conta?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
