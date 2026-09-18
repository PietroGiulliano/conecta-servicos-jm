import { Link } from "react-router-dom";
import { Briefcase, CheckCircle2, Star, Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import { Button, Card, CardHeader, EmptyState, ErrorState, SkeletonRows } from "@/components/ui";
import { StatCard } from "@/components/StatCard";
import { useRequest } from "@/hooks/useRequest";
import { useAuth } from "@/hooks/useAuth";
import * as walletService from "@/services/wallet.service";
import * as serviceRequestsService from "@/services/serviceRequests.service";
import * as providersService from "@/services/providers.service";
import { formatCurrency, formatDate, formatRating } from "@/utils/format";

export default function PrestadorDashboard() {
  const { user } = useAuth();
  const wallet = useRequest(() => walletService.getMine(), []);
  const oportunidades = useRequest(() => serviceRequestsService.listAvailable(), []);
  const paymentStatus = useRequest(() => providersService.getPaymentStatus(), []);
  const perfil = useRequest(() => providersService.getMyProfile(), []);

  const saldo = wallet.data?.wallet;
  const novas = (oportunidades.data ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Olá, {user?.name ?? "profissional"}</h1>
        <p className="mt-1 text-sm text-slate-500">Seu resumo financeiro e as oportunidades abertas para você.</p>
      </div>

      {user?.approvalStatus === "PENDENTE" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning-light px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>Seu cadastro está em análise. Você ainda não aparece nas buscas, mas já pode preparar seu perfil e seus recebimentos.</p>
        </div>
      ) : null}

      {paymentStatus.data && !paymentStatus.data.connected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary-light px-4 py-3 text-sm text-primary">
          <p>Conecte sua conta Mercado Pago para receber os pagamentos dos serviços.</p>
          <Link to="/prestador/pagamentos">
            <Button size="sm">Conectar agora</Button>
          </Link>
        </div>
      ) : null}

      {wallet.error ? (
        <ErrorState message={wallet.error} onRetry={wallet.reload} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Saldo disponível"
            value={formatCurrency(saldo?.availableBalance ?? 0)}
            hint="Pronto para repasse"
            icon={<Wallet className="h-5 w-5" aria-hidden />}
            loading={wallet.loading}
          />
          <StatCard
            label="Saldo pendente"
            value={formatCurrency(saldo?.pendingBalance ?? 0)}
            hint="Liberado após a conclusão"
            icon={<TrendingUp className="h-5 w-5" aria-hidden />}
            loading={wallet.loading}
          />
          <StatCard
            label="Total recebido"
            value={formatCurrency(saldo?.totalReceived ?? 0)}
            icon={<Wallet className="h-5 w-5" aria-hidden />}
            loading={wallet.loading}
          />
          <StatCard
            label="Serviços realizados"
            value={wallet.data?.completedOrders ?? 0}
            icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
            loading={wallet.loading}
          />
          <StatCard
            label="Avaliação"
            value={perfil.data ? formatRating(perfil.data.ratingAverage) : "—"}
            hint={perfil.data ? `${perfil.data.ratingCount} avaliações` : undefined}
            icon={<Star className="h-5 w-5" aria-hidden />}
            loading={perfil.loading}
          />
        </div>
      )}

      <Card>
        <CardHeader
          title="Novas oportunidades"
          description="Solicitações da sua categoria e das cidades que você atende"
          action={
            <Link to="/prestador/oportunidades" className="text-sm font-semibold text-primary hover:underline">
              Ver todas
            </Link>
          }
        />
        <div className="p-5">
          {oportunidades.loading ? (
            <SkeletonRows count={3} />
          ) : oportunidades.error ? (
            <ErrorState message={oportunidades.error} onRetry={oportunidades.reload} />
          ) : novas.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-6 w-6" aria-hidden />}
              title="Nenhuma oportunidade no momento."
              description="Amplie as cidades que você atende no seu perfil para receber mais solicitações."
            />
          ) : (
            <ul className="space-y-3">
              {novas.map((request) => (
                <li key={request.id}>
                  <Link
                    to={`/prestador/oportunidades/${request.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-primary hover:bg-primary-light/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{request.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {request.category?.name ?? "—"} · {request.city} · {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-ink">
                      {request.approxBudget ? formatCurrency(request.approxBudget) : "Orçamento aberto"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
