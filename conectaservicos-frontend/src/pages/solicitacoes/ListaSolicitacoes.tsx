import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { Button, Card, EmptyState, ErrorState, SkeletonRows } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { useRequest } from "@/hooks/useRequest";
import * as serviceRequestsService from "@/services/serviceRequests.service";
import { formatCurrency, formatDate } from "@/utils/format";
import { requestFilters } from "@/utils/status";
import type { ServiceRequestStatus } from "@/types/api";

/** Lista de solicitações do cliente ou da empresa (GET /service-requests/mine). */
export function ListaSolicitacoes({ basePath }: { basePath: "/cliente" | "/empresa" }) {
  const [filter, setFilter] = useState<"TODAS" | ServiceRequestStatus>("TODAS");
  const { data, loading, error, reload } = useRequest(() => serviceRequestsService.listMine(), []);

  const items = useMemo(() => {
    const list = data ?? [];
    if (filter === "TODAS") return list;
    return list.filter((request) => request.status === filter);
  }, [data, filter]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Minhas solicitações</h1>
          <p className="mt-1 text-sm text-slate-500">Acompanhe propostas, pagamentos e andamento de cada serviço.</p>
        </div>
        <Link to={`${basePath}/solicitacoes/nova`}>
          <Button icon={<Plus className="h-4 w-4" aria-hidden />}>Solicitar serviço</Button>
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {requestFilters.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filter === option.value
                ? "bg-primary text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <SkeletonRows count={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" aria-hidden />}
            title={filter === "TODAS" ? "Você ainda não possui solicitações." : "Nenhuma solicitação neste filtro."}
            description={filter === "TODAS" ? "Publique o que você precisa e receba propostas de profissionais." : undefined}
            action={
              filter === "TODAS" ? (
                <Link to={`${basePath}/solicitacoes/nova`}>
                  <Button>Solicitar serviço</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Tabela no desktop */}
            <Card className="hidden overflow-hidden lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Serviço</th>
                    <th className="px-5 py-3">Categoria</th>
                    <th className="px-5 py-3">Cidade</th>
                    <th className="px-5 py-3">Propostas</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Data</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((request) => (
                    <tr key={request.id} className="transition hover:bg-slate-50">
                      <td className="max-w-xs px-5 py-3.5">
                        <p className="truncate font-medium text-ink">{request.title}</p>
                        {request.approxBudget ? (
                          <p className="text-xs text-slate-500">Orçamento: {formatCurrency(request.approxBudget)}</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{request.category?.name ?? "—"}</td>
                      <td className="px-5 py-3.5 text-slate-600">{request.city}</td>
                      <td className="px-5 py-3.5 text-slate-600">{request.proposals?.length ?? 0}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={request.status} /></td>
                      <td className="px-5 py-3.5 text-slate-600">{formatDate(request.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link to={`${basePath}/solicitacoes/${request.id}`}>
                          <Button variant="outline" size="sm">Ver detalhes</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Cards no celular */}
            <div className="space-y-3 lg:hidden">
              {items.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-ink">{request.title}</p>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {request.category?.name ?? "—"} · {request.city}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                    <span>{request.proposals?.length ?? 0} proposta(s)</span>
                    <span>{formatDate(request.createdAt)}</span>
                  </div>
                  <Link to={`${basePath}/solicitacoes/${request.id}`} className="mt-4 block">
                    <Button variant="outline" size="sm" className="w-full">Ver detalhes</Button>
                  </Link>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
