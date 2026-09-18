import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FileText, Hammer, Plus, Wallet } from "lucide-react";
import { Button, Card, CardHeader, EmptyState, ErrorState, SkeletonCards, SkeletonRows } from "@/components/ui";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useRequest } from "@/hooks/useRequest";
import { useAuth } from "@/hooks/useAuth";
import * as serviceRequestsService from "@/services/serviceRequests.service";
import { formatCurrency, formatDate, toNumber } from "@/utils/format";

/**
 * Painel de cliente e de empresa. Os números vêm de GET /service-requests/mine —
 * o backend não expõe um endpoint de agregação para estes papéis (ver README).
 */
export function DashboardSolicitante({ basePath }: { basePath: "/cliente" | "/empresa" }) {
  const { user } = useAuth();
  const { data, loading, error, reload } = useRequest(() => serviceRequestsService.listMine(), []);

  const stats = useMemo(() => {
    const list = data ?? [];
    const paidOrders = list
      .map((request) => request.order)
      .filter((order) => order && order.payment?.status === "APROVADO");

    return {
      abertas: list.filter((r) => r.status === "SOLICITADO" || r.status === "PROPOSTAS_RECEBIDAS").length,
      propostas: list.reduce((total, request) => total + (request.proposals?.length ?? 0), 0),
      andamento: list.filter((r) => r.status === "EM_ANDAMENTO" || r.status === "PAGAMENTO_APROVADO").length,
      concluidos: list.filter((r) => r.status === "CONCLUIDO").length,
      totalPago: paidOrders.reduce((total, order) => total + toNumber(order?.grossAmount), 0),
    };
  }, [data]);

  const recentes = (data ?? []).slice(0, 5);
  const isEmpresa = basePath === "/empresa";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Olá, {user?.name ?? "tudo bem"}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isEmpresa
              ? "Acompanhe as demandas da sua empresa e as propostas recebidas."
              : "Acompanhe suas solicitações e propostas em um só lugar."}
          </p>
        </div>
        <Link to={`${basePath}/solicitacoes/nova`}>
          <Button icon={<Plus className="h-4 w-4" aria-hidden />}>Solicitar serviço</Button>
        </Link>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <div className={`grid gap-4 sm:grid-cols-2 ${isEmpresa ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
            <StatCard label="Solicitações abertas" value={stats.abertas} icon={<FileText className="h-5 w-5" aria-hidden />} loading={loading} />
            <StatCard label="Propostas recebidas" value={stats.propostas} icon={<Hammer className="h-5 w-5" aria-hidden />} loading={loading} />
            <StatCard label="Serviços em andamento" value={stats.andamento} icon={<Hammer className="h-5 w-5" aria-hidden />} loading={loading} />
            <StatCard label="Serviços concluídos" value={stats.concluidos} icon={<CheckCircle2 className="h-5 w-5" aria-hidden />} loading={loading} />
            {isEmpresa ? (
              <StatCard
                label="Total pago"
                value={formatCurrency(stats.totalPago)}
                hint="Pedidos com pagamento aprovado"
                icon={<Wallet className="h-5 w-5" aria-hidden />}
                loading={loading}
              />
            ) : null}
          </div>

          <Card>
            <CardHeader
              title="Solicitações recentes"
              action={
                <Link to={`${basePath}/solicitacoes`} className="text-sm font-semibold text-primary hover:underline">
                  Ver todas
                </Link>
              }
            />
            <div className="p-5">
              {loading ? (
                <SkeletonRows count={3} />
              ) : recentes.length === 0 ? (
                <EmptyState
                  title="Você ainda não possui solicitações."
                  description="Publique sua primeira demanda e receba propostas de profissionais da sua região."
                  action={
                    <Link to={`${basePath}/solicitacoes/nova`}>
                      <Button>Solicitar serviço</Button>
                    </Link>
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {recentes.map((request) => (
                    <li key={request.id}>
                      <Link
                        to={`${basePath}/solicitacoes/${request.id}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-primary hover:bg-primary-light/30"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{request.title}</p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {request.category?.name ?? "—"} · {request.city} · {formatDate(request.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500">{request.proposals?.length ?? 0} proposta(s)</span>
                          <StatusBadge status={request.status} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
