import { Link } from "react-router-dom";
import { Briefcase, MapPin } from "lucide-react";
import { Button, Card, EmptyState, ErrorState, SkeletonCards } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import * as serviceRequestsService from "@/services/serviceRequests.service";
import { formatCurrency, formatDate } from "@/utils/format";

export default function Oportunidades() {
  const { data, loading, error, reload } = useRequest(() => serviceRequestsService.listAvailable(), []);
  const items = data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Oportunidades</h1>
      <p className="mt-1 text-sm text-slate-500">
        Solicitações compatíveis com sua categoria e com as cidades que você atende, sem proposta sua ainda.
      </p>

      <div className="mt-6">
        {loading ? (
          <SkeletonCards count={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-6 w-6" aria-hidden />}
            title="Nenhuma oportunidade aberta agora."
            description="Novas solicitações aparecem aqui assim que forem publicadas na sua categoria e cidade."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((request) => (
              <Card key={request.id} className="flex flex-col p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {request.category?.name ?? "Serviço"}
                </p>
                <h2 className="mt-2 font-semibold text-ink">{request.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{request.description}</p>

                <div className="mt-4 space-y-1.5 text-sm text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" aria-hidden />
                    {request.city}
                  </p>
                  <p>Publicada em {formatDate(request.createdAt)}</p>
                  {request.desiredDate ? <p>Data desejada: {formatDate(request.desiredDate)}</p> : null}
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <div>
                    <p className="text-xs text-slate-500">Orçamento</p>
                    <p className="font-bold text-ink">
                      {request.approxBudget ? formatCurrency(request.approxBudget) : "Aberto"}
                    </p>
                  </div>
                  <Link to={`/prestador/oportunidades/${request.id}`}>
                    <Button size="sm">Ver oportunidade</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
