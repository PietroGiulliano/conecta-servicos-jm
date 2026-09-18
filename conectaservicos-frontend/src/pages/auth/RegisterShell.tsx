import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui";
import { Logo } from "@/components/Logo";

/** Moldura comum aos três formulários de cadastro. */
export function RegisterShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Logo />
          <Link to="/cadastro" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Trocar tipo de conta
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        <Card className="mt-6 p-6">{children}</Card>
        <p className="mt-6 text-center text-sm text-slate-600">
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

export const estados = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];
