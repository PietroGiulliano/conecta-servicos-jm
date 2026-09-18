import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button, Card, ErrorState, Skeleton } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { useRequest } from "@/hooks/useRequest";
import { useAuth } from "@/hooks/useAuth";
import * as ordersService from "@/services/orders.service";
import { formatCurrency } from "@/utils/format";

type Resultado = "sucesso" | "pendente" | "falha";

const conteudo: Record<Resultado, { icon: typeof CheckCircle2; cor: string; titulo: string; texto: string }> = {
  sucesso: {
    icon: CheckCircle2,
    cor: "text-success",
    titulo: "Pagamento recebido",
    texto:
      "A confirmação definitiva vem do gateway pelo webhook. Quando ela chegar, o pedido passa para pagamento aprovado e o profissional é avisado.",
  },
  pendente: {
    icon: Clock,
    cor: "text-warning",
    titulo: "Pagamento em processamento",
    texto: "Assim que o gateway confirmar, o status do pedido é atualizado automaticamente. Você não precisa pagar de novo.",
  },
  falha: {
    icon: XCircle,
    cor: "text-danger",
    titulo: "O pagamento não foi concluído",
    texto: "Nenhum valor foi cobrado. Você pode tentar novamente com outra forma de pagamento.",
  },
};

export default function StatusPagamento({ resultado }: { resultado: Resultado }) {
  const { orderId = "" } = useParams();
  const { user } = useAuth();
  const { data: order, loading, error, reload } = useRequest(() => ordersService.getById(orderId), [orderId]);

  const info = conteudo[resultado];
  const Icon = info.icon;
  const basePath = user?.role === "EMPRESA" ? "/empresa" : "/cliente";

  return (
    <div className="mx-auto max-w-xl">
      <Card className="p-8 text-center">
        <Icon className={`mx-auto h-14 w-14 ${info.cor}`} aria-hidden />
        <h1 className="mt-4 text-2xl font-bold text-ink">{info.titulo}</h1>
        <p className="mt-2 text-sm text-slate-600">{info.texto}</p>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-left text-sm">
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : error || !order ? (
            <ErrorState message={error ?? "Não foi possível carregar o pedido."} onRetry={reload} />
          ) : (
            <>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Serviço</span>
                <span className="text-right font-medium text-ink">{order.serviceRequest?.title ?? "—"}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-slate-500">Valor</span>
                <span className="font-medium text-ink">{formatCurrency(order.grossAmount)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-slate-500">Status do pagamento</span>
                {order.payment ? <StatusBadge status={order.payment.status} /> : <span className="text-slate-500">Não iniciado</span>}
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {order?.serviceRequestId ? (
            <Link to={`${basePath}/solicitacoes/${order.serviceRequestId}`}>
              <Button>Acompanhar serviço</Button>
            </Link>
          ) : null}
          {resultado === "falha" ? (
            <Link to={`/checkout/${orderId}`}>
              <Button variant="outline">Tentar pagar novamente</Button>
            </Link>
          ) : (
            <Button variant="outline" onClick={reload}>
              Atualizar status
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
