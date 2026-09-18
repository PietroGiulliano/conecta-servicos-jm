import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  MessageSquare,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Button, Card, Input, Skeleton } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import * as categoriesService from "@/services/categories.service";

const etapas = [
  {
    icon: FileText,
    titulo: "Publique",
    texto: "Informe qual serviço você precisa.",
  },
  {
    icon: MessageSquare,
    titulo: "Receba propostas",
    texto: "Profissionais compatíveis recebem sua solicitação.",
  },
  {
    icon: CheckCircle2,
    titulo: "Escolha",
    texto: "Compare propostas e escolha o profissional.",
  },
  {
    icon: CreditCard,
    titulo: "Contrate",
    texto: "Pague pela plataforma e acompanhe o serviço.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const categories = useRequest(() => categoriesService.list(), []);
  const [servico, setServico] = useState("");
  const [cidade, setCidade] = useState("");

  function buscar(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (servico) params.set("categoria", servico);
    if (cidade) params.set("cidade", cidade);
    navigate(`/prestadores?${params.toString()}`);
  }

  return (
    <>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-sm font-medium text-primary">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Pagamento protegido pela plataforma
            </p>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Encontre o profissional certo para o seu serviço.
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
              Publique sua necessidade, receba propostas de profissionais e contrate com segurança.
            </p>

            <form onSubmit={buscar} className="mt-7 grid gap-3 sm:grid-cols-[1.4fr_1fr_auto]">
              <div>
                <label htmlFor="servico" className="sr-only">O que você precisa?</label>
                {categories.loading ? (
                  <Skeleton className="h-11 w-full" />
                ) : (
                  <select
                    id="servico"
                    value={servico}
                    onChange={(event) => setServico(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">O que você precisa?</option>
                    {(categories.data ?? []).map((category) => (
                      <option key={category.id} value={category.slug}>{category.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label htmlFor="cidade" className="sr-only">Cidade</label>
                <Input id="cidade" placeholder="Cidade" value={cidade} onChange={(event) => setCidade(event.target.value)} />
              </div>
              <Button type="submit" size="lg" icon={<Search className="h-4 w-4" aria-hidden />}>
                Encontrar profissionais
              </Button>
            </form>

            {categories.data && categories.data.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {categories.data.slice(0, 6).map((category) => (
                  <Link
                    key={category.id}
                    to={`/prestadores?categoria=${category.slug}`}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-primary hover:text-primary"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Como o dinheiro funciona aqui</p>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">1</span>
                <span className="text-slate-600">
                  <strong className="block text-ink">Você paga pela plataforma</strong>
                  O valor fica retido até a conclusão do serviço.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">2</span>
                <span className="text-slate-600">
                  <strong className="block text-ink">O profissional executa</strong>
                  Você acompanha cada etapa pelo painel e pelo chat.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">3</span>
                <span className="text-slate-600">
                  <strong className="block text-ink">Você confirma a conclusão</strong>
                  Só então o valor é liberado para o profissional.
                </span>
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14">
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">Como funciona</h2>
        <p className="mt-2 text-slate-600">Da publicação ao pagamento, em quatro etapas.</p>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {etapas.map((etapa, index) => (
            <li key={etapa.titulo}>
              <Card className="h-full p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                    <etapa.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-slate-400">Etapa {index + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">{etapa.titulo}</h3>
                <p className="mt-1 text-sm text-slate-600">{etapa.texto}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Empresas e prestadores */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 lg:grid-cols-2">
        <Card className="flex flex-col justify-between gap-6 bg-ink p-8 text-white">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <Building2 className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-5 text-2xl font-bold">Sua empresa precisa de profissionais?</h2>
            <p className="mt-2 text-slate-300">
              Encontre profissionais para manutenção, instalações, reparos e outros serviços.
            </p>
          </div>
          <Link to="/cadastro/empresa">
            <Button variant="secondary" size="lg" icon={<ArrowRight className="h-4 w-4" aria-hidden />}>
              Solicitar serviço para minha empresa
            </Button>
          </Link>
        </Card>

        <Card className="flex flex-col justify-between gap-6 p-8">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Wrench className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-5 text-2xl font-bold text-ink">Você presta serviços?</h2>
            <p className="mt-2 text-slate-600">Encontre novas oportunidades e aumente seus clientes.</p>
          </div>
          <Link to="/cadastro/prestador">
            <Button size="lg" icon={<ArrowRight className="h-4 w-4" aria-hidden />}>
              Quero ser prestador
            </Button>
          </Link>
        </Card>
      </section>
    </>
  );
}
