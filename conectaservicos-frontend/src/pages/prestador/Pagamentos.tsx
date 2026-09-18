import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, CreditCard } from "lucide-react";
import { Button, Card, ErrorState, Skeleton } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { useToast } from "@/contexts/ToastContext";
import * as providersService from "@/services/providers.service";
import { getErrorMessage } from "@/utils/errors";
import { formatDate } from "@/utils/format";

/**
 * Conexão da conta Mercado Pago do prestador (OAuth). O frontend apenas pede a
 * URL de autorização ao backend e redireciona. Nenhum token, client id ou
 * client secret trafega ou é armazenado aqui.
 */
export default function Pagamentos() {
  const toast = useToast();
  const [params] = useSearchParams();
  const retorno = params.get("mercadopago");
  const { data, loading, error, reload } = useRequest(() => providersService.getPaymentStatus(), []);
  const [connecting, setConnecting] = useState(false);

  async function conectar() {
    setConnecting(true);
    try {
      const url = await providersService.getMercadoPagoAuthorizationUrl();
      window.location.href = url;
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível iniciar a conexão com o Mercado Pago."));
      setConnecting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Recebimentos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Conecte sua conta para receber os pagamentos dos serviços realizados através da plataforma.
        </p>
      </div>

      {retorno === "connected" ? (
        <p className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success-light px-4 py-3 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Conta conectada com sucesso.
        </p>
      ) : null}

      <Card className="p-6">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : data?.connected ? (
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-12 w-12 text-success" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold text-ink">Conta conectada</h2>
            <p className="mt-1 text-sm text-slate-600">
              Seus pagamentos são repassados pelo gateway conforme as regras da plataforma.
            </p>
            {data.expiresAt ? (
              <p className="mt-2 text-xs text-slate-400">Autorização válida até {formatDate(data.expiresAt)}</p>
            ) : null}
            <Button variant="outline" className="mt-5" loading={connecting} onClick={conectar}>
              Reconectar conta
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
              <CreditCard className="h-6 w-6" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-ink">Conecte sua conta Mercado Pago</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-600">
              Conecte sua conta para receber os pagamentos dos serviços realizados através da plataforma.
            </p>
            <Button size="lg" className="mt-5" loading={connecting} onClick={conectar}>
              Conectar Mercado Pago
            </Button>
            {retorno && retorno !== "connected" ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-danger">
                <AlertTriangle className="h-4 w-4" aria-hidden />
                Não foi possível conectar. Tente novamente.
              </p>
            ) : null}
          </div>
        )}
      </Card>

      <p className="text-xs text-slate-400">
        A autorização acontece no site do Mercado Pago. As credenciais ficam criptografadas no servidor e nunca chegam ao navegador.
      </p>
    </div>
  );
}
