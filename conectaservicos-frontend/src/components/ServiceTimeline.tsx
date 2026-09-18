import { Check } from "lucide-react";
import type { ServiceRequestStatus } from "@/types/api";
import { formatStatus, serviceTimeline } from "@/utils/status";

/** Linha do tempo do serviço: solicitado → pago → em andamento → concluído. */
export function ServiceTimeline({ status }: { status: ServiceRequestStatus }) {
  if (status === "CANCELADO" || status === "ESTORNADO") {
    return (
      <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
        {status === "CANCELADO"
          ? "Este serviço foi cancelado."
          : "O pagamento deste serviço foi estornado."}
      </p>
    );
  }

  const normalized: ServiceRequestStatus = status === "PROPOSTA_ACEITA" ? "AGUARDANDO_PAGAMENTO" : status;
  const currentIndex = serviceTimeline.indexOf(normalized);

  return (
    <ol className="space-y-0">
      {serviceTimeline.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-success text-white"
                    : active
                    ? "bg-primary text-white ring-4 ring-primary-light"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
              </span>
              {index < serviceTimeline.length - 1 ? (
                <span className={`h-8 w-0.5 ${done ? "bg-success" : "bg-slate-200"}`} aria-hidden />
              ) : null}
            </div>
            <p className={`pt-1 text-sm ${active ? "font-semibold text-ink" : done ? "text-slate-600" : "text-slate-400"}`}>
              {formatStatus(step).label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
