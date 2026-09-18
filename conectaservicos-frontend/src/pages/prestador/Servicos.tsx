import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { Button, Card, EmptyState, ErrorState, SkeletonRows } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { ServiceTimeline } from "@/components/ServiceTimeline";
import { EndpointPendente } from "@/components/EndpointPendente";
import { useRequest } from "@/hooks/useRequest";
import { useToast } from "@/contexts/ToastContext";
import * as ordersService from "@/services/orders.service";
import { getErrorMessage } from "@/utils/errors";
import { formatCurrency, formatDate } from "@/utils/format";
import type { ServiceRequestStatus } from "@/types/api";

const filtros: { value: "TODOS" | ServiceRequestStatus; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "AGUARDANDO_PAGAMENTO", label: "Aguardando pagamento" },
  { value: "PAGAMENTO_APROVADO", label: "Pagos" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "CONCLUIDO", label: "Concluídos" },
  { value: "CANCELADO", label: "Cancelados" },
];

export default function Servicos() {
  const toast = useToast();
  const [filtro, setFiltro] = useState<"TODOS" | ServiceRequestStatus>("TODOS");
  const [startingId, setStartingId] = useState<string | null>(null);
  const { data, loading, error, missingEndpoint, reload } = useRequest(() => ordersService.listMine(), []);

  const items = useMemo(() => {
    const list = data ?? [];
    if (filtro === "TODOS") return list;
    return list.filter((order) => order.serviceRequest?.status === filtro);
  }, [data, filtro]);

  async function iniciar(orderId: string) {
    setStartingId(orderId);
    try {
      await ordersService.start(orderId);
      toast.success("Serviço iniciado. O cliente pode acompanhar pelo painel.");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível iniciar o serviço."));
    } finally {
      setStartingId(null);
    }
  }

  if (missingEndpoint) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ink">Meus serviços</h1>
        <div className="mt-6">
          <EndpointPendente
            titulo="Listagem de serviços ainda não disponível"
            endpoint="GET /api/orders/mine"
            descricao="O backend expõe o pedido individual (GET /orders/:id) e as ações de iniciar e concluir, mas ainda não lista os pedidos do prestador logado. Com essa rota publicada, esta tela funciona imediatamente."
            onRetry={reload}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Meus serviços</h1>
      <p className="mt-1 text-sm text-slate-500">
        A liberação do valor acontece quando o cliente confirma a conclusão — o controle é do backend.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {filtros.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFiltro(option.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filtro === option.value
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
          <SkeletonRows count={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" aria-hidden />}
            title="Nenhum serviço neste filtro."
            description="Assim que uma proposta sua for aceita e paga, o serviço aparece aqui."
          />
        ) : (
          <div className="space-y-4">
            {items.map((order) => {
              const status = order.serviceRequest?.status;
              return (
                <Card key={order.id} className="p-5">
                  <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{order.serviceRequest?.title ?? "Serviço"}</p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {order.serviceRequest?.city ?? ""} · Pedido de {formatDate(order.createdAt)}
                          </p>
                        </div>
                        {status ? <StatusBadge status={status} /> : null}
                      </div>

                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-400">Valor do serviço</dt>
                          <dd className="font-medium text-ink">{formatCurrency(order.grossAmount)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-400">Comissão</dt>
                          <dd className="font-medium text-ink">{formatCurrency(order.commissionAmount)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-400">Você recebe</dt>
                          <dd className="font-semibold text-success">{formatCurrency(order.providerAmount)}</dd>
                        </div>
                      </dl>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {status === "PAGAMENTO_APROVADO" ? (
                          <Button loading={startingId === order.id} onClick={() => iniciar(order.id)}>
                            Iniciar serviço
                          </Button>
                        ) : null}
                        {status === "EM_ANDAMENTO" ? (
                          <p className="rounded-xl bg-primary-light px-4 py-2.5 text-sm text-primary">
                            Em execução. Quando terminar, peça ao cliente a confirmação de conclusão pelo painel dele.
                          </p>
                        ) : null}
                        <Link to={`/chat/${order.serviceRequestId}`}>
                          <Button variant="outline">Conversar com o cliente</Button>
                        </Link>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      {status ? <ServiceTimeline status={status} /> : null}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
