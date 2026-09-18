import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CreditCard, QrCode, ShieldCheck, Copy, ExternalLink } from "lucide-react";
import { Button, Card, ErrorState, Skeleton } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { useRequest } from "@/hooks/useRequest";
import { useToast } from "@/contexts/ToastContext";
import * as ordersService from "@/services/orders.service";
import * as paymentsService from "@/services/payments.service";
import { getErrorMessage } from "@/utils/errors";
import { formatCurrency, toNumber } from "@/utils/format";
import type { CheckoutResponse } from "@/types/api";

/**
 * Checkout. Todos os valores exibidos vêm do pedido criado pelo backend
 * (grossAmount, commissionRate, commissionAmount, providerAmount). O frontend
 * não calcula nem decide nada financeiro: apenas apresenta e redireciona.
 */
export default function Checkout() {
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: order, loading, error, reload } = useRequest(() => ordersService.getById(orderId), [orderId]);

  const [method, setMethod] = useState<paymentsService.CheckoutMethod>("PIX");
  const [processing, setProcessing] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);

  async function pagar() {
    setProcessing(true);
    try {
      const result = await paymentsService.createCheckout(orderId, method);
      setCheckout(result);

      // Quando o gateway devolve uma URL de checkout, o pagamento acontece no
      // ambiente seguro dele. Nenhum dado de cartão passa por esta aplicação.
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      if (!result.qrCode) {
        toast.success("Pagamento iniciado. Acompanhe o status do pedido.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível iniciar o pagamento. Tente novamente."));
    } finally {
      setProcessing(false);
    }
  }

  async function copiarCodigo() {
    if (!checkout?.qrCode) return;
    try {
      await navigator.clipboard.writeText(checkout.qrCode);
      toast.success("Código copiado.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o código manualmente.");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return <ErrorState message={error ?? "Pedido não encontrado."} onRetry={reload} />;
  }

  const payment = checkout?.payment ?? order.payment;
  const alreadyPaid = order.payment?.status === "APROVADO";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Pagamento do serviço</h1>
        <p className="mt-1 text-sm text-slate-500">
          O valor fica retido até você confirmar a conclusão do serviço.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-ink">Resumo</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Serviço</dt>
            <dd className="text-right font-medium text-ink">{order.serviceRequest?.title ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Profissional</dt>
            <dd className="text-right font-medium text-ink">{order.provider?.professionalName ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-slate-100 pt-3">
            <dt className="text-slate-500">Valor do serviço</dt>
            <dd className="font-medium text-ink">{formatCurrency(order.grossAmount)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Comissão ConectaServiços ({toNumber(order.commissionRate)}%)</dt>
            <dd className="font-medium text-ink">{formatCurrency(order.commissionAmount)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Repasse ao profissional</dt>
            <dd className="font-medium text-ink">{formatCurrency(order.providerAmount)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-slate-100 pt-3">
            <dt className="text-base font-semibold text-ink">Total a pagar</dt>
            <dd className="text-2xl font-bold text-ink">{formatCurrency(order.grossAmount)}</dd>
          </div>
        </dl>
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
          Valores calculados e confirmados pelo servidor. A comissão deste pedido fica registrada e não muda depois.
        </p>
      </Card>

      {alreadyPaid ? (
        <Card className="p-6 text-center">
          <StatusBadge status="APROVADO" />
          <p className="mt-3 text-sm text-slate-600">Este pedido já foi pago. O profissional já pode iniciar o serviço.</p>
          <Link to={`/pedidos/${order.id}/pagamento/sucesso`} className="mt-4 inline-block">
            <Button variant="outline">Ver comprovante</Button>
          </Link>
        </Card>
      ) : (
        <Card className="p-6">
          <h2 className="text-base font-semibold text-ink">Forma de pagamento</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MethodOption
              selected={method === "PIX"}
              onSelect={() => setMethod("PIX")}
              icon={<QrCode className="h-5 w-5" aria-hidden />}
              title="Pix"
              description="Aprovação em segundos."
            />
            <MethodOption
              selected={method === "CARTAO_CREDITO"}
              onSelect={() => setMethod("CARTAO_CREDITO")}
              icon={<CreditCard className="h-5 w-5" aria-hidden />}
              title="Cartão de crédito"
              description="Você conclui no ambiente do gateway."
            />
          </div>

          {checkout?.qrCode ? (
            <div className="mt-6 rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-ink">Pague com Pix</p>
              {checkout.qrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${checkout.qrCodeBase64}`}
                  alt="QR Code do pagamento Pix"
                  className="mx-auto mt-4 h-48 w-48"
                />
              ) : null}
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Código copia e cola</p>
              <p className="mt-1 break-all rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{checkout.qrCode}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button variant="outline" icon={<Copy className="h-4 w-4" aria-hidden />} onClick={copiarCodigo}>
                  Copiar código
                </Button>
                {payment ? <StatusBadge status={payment.status} /> : null}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                A confirmação chega pelo gateway. Assim que o pagamento for aprovado, o status do pedido muda sozinho.
              </p>
              <Button variant="ghost" className="mt-2" onClick={reload}>
                Atualizar status
              </Button>
            </div>
          ) : null}

          {checkout?.checkoutUrl ? (
            <a href={checkout.checkoutUrl} className="mt-4 inline-flex">
              <Button variant="outline" icon={<ExternalLink className="h-4 w-4" aria-hidden />}>
                Abrir checkout seguro
              </Button>
            </a>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" loading={processing} onClick={pagar}>
              {method === "PIX" ? "Gerar Pix" : "Pagar com cartão"}
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Não guardamos dados de cartão. O pagamento é processado pelo gateway configurado no servidor.
          </p>
        </Card>
      )}
    </div>
  );
}

function MethodOption({
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        selected ? "border-primary bg-primary-light/50" : "border-slate-200 hover:border-primary"
      }`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}>
        {icon}
      </span>
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block text-sm text-slate-500">{description}</span>
      </span>
    </button>
  );
}
