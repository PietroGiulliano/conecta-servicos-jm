import { Link } from "react-router-dom";
import { Handshake } from "lucide-react";
import { Button, Card, EmptyState, ErrorState, SkeletonRows } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { EndpointPendente } from "@/components/EndpointPendente";
import { useRequest } from "@/hooks/useRequest";
import * as proposalsService from "@/services/proposals.service";
import { formatCurrency, formatDate } from "@/utils/format";

export default function Propostas() {
  const { data, loading, error, missingEndpoint, reload } = useRequest(() => proposalsService.listMine(), []);
  const items = data ?? [];

  if (missingEndpoint) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ink">Minhas propostas</h1>
        <div className="mt-6">
          <EndpointPendente
            titulo="Listagem de propostas ainda não disponível"
            endpoint="GET /api/proposals/mine"
            descricao="O backend cria e aceita propostas, mas ainda não expõe a listagem das propostas do prestador logado. Assim que essa rota existir, esta tela passa a funcionar sem nenhuma outra alteração."
            onRetry={reload}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Minhas propostas</h1>
      <p className="mt-1 text-sm text-slate-500">Acompanhe o que você enviou e o que foi aceito.</p>

      <div className="mt-6">
        {loading ? (
          <SkeletonRows count={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Handshake className="h-6 w-6" aria-hidden />}
            title="Você ainda não enviou propostas."
            description="Veja as oportunidades abertas na sua categoria e envie sua primeira proposta."
            action={
              <Link to="/prestador/oportunidades">
                <Button>Ver oportunidades</Button>
              </Link>
            }
          />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Solicitação</th>
                  <th className="px-5 py-3">Valor</th>
                  <th className="px-5 py-3">Prazo</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Enviada em</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink">{proposal.serviceRequest?.title ?? "Solicitação"}</p>
                      <p className="text-xs text-slate-500">{proposal.serviceRequest?.city ?? ""}</p>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-ink">{formatCurrency(proposal.value)}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {proposal.estimatedDays ? `${proposal.estimatedDays} dia(s)` : "—"}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={proposal.status} /></td>
                    <td className="px-5 py-3.5 text-slate-600">{formatDate(proposal.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to={`/chat/${proposal.serviceRequestId}`}>
                        <Button variant="outline" size="sm">Conversar</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
