import { PlugZap } from "lucide-react";
import { Button, Card } from "@/components/ui";

/**
 * Exibido quando uma rota necessária ainda não existe no backend. A camada de
 * serviço já está pronta: basta o endpoint responder para a tela funcionar.
 * A lista completa está na seção "Endpoints pendentes" do README.
 */
export function EndpointPendente({
  titulo,
  endpoint,
  descricao,
  onRetry,
}: {
  titulo: string;
  endpoint: string;
  descricao: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-light text-amber-700">
        <PlugZap className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-ink">{titulo}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{descricao}</p>
      <p className="mx-auto mt-4 inline-block rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs text-slate-600">
        {endpoint}
      </p>
      {onRetry ? (
        <div className="mt-5">
          <Button variant="outline" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
