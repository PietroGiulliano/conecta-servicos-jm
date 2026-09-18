import { Link, useNavigate, useParams } from "react-router-dom";
import { MapPin, Ruler } from "lucide-react";
import { Button, Card, CardHeader, ErrorState, Skeleton, Stars } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { useAuth } from "@/hooks/useAuth";
import * as providersService from "@/services/providers.service";
import { formatCurrency, formatDate, formatRating, initials, toNumber } from "@/utils/format";

export default function PerfilPrestador() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: provider, loading, error, reload } = useRequest(() => providersService.getById(id), [id]);

  function solicitarServico() {
    if (!user) {
      navigate("/login", { state: { from: `/prestadores/${id}` } });
      return;
    }
    const base = user.role === "EMPRESA" ? "/empresa/solicitacoes/nova" : "/cliente/solicitacoes/nova";
    navigate(`${base}?prestador=${id}`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <ErrorState message={error ?? "Prestador não encontrado."} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {provider.photoUrl ? (
            <img src={provider.photoUrl} alt="" className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white">
              {initials(provider.professionalName)}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-ink">{provider.professionalName}</h1>
            <p className="mt-0.5 text-slate-500">{provider.category ?? "Sem categoria"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <Stars value={toNumber(provider.ratingAverage)} />
                {formatRating(provider.ratingAverage)} · {provider.ratingCount} avaliações
              </span>
              {provider.citiesServed.length > 0 ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {provider.citiesServed.join(", ")}
                </span>
              ) : null}
              <span className="flex items-center gap-1.5">
                <Ruler className="h-4 w-4" aria-hidden />
                A partir de {formatCurrency(provider.startingPrice)}
              </span>
            </div>
          </div>

          <Button size="lg" onClick={solicitarServico}>
            Solicitar serviço
          </Button>
        </div>

        {provider.bio ? <p className="mt-6 whitespace-pre-line text-slate-600">{provider.bio}</p> : null}
      </Card>

      {provider.gallery.length > 0 ? (
        <Card className="mt-6">
          <CardHeader title="Trabalhos anteriores" />
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {provider.gallery.map((item) => (
              <figure key={item.id}>
                <img src={item.imageUrl} alt={item.caption ?? ""} className="h-40 w-full rounded-xl object-cover" />
                {item.caption ? <figcaption className="mt-1 text-xs text-slate-500">{item.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </Card>
      ) : null}

      <Card className="mt-6">
        <CardHeader title="Avaliações" description={`${provider.ratingCount} avaliações de clientes`} />
        {provider.reviews.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Este profissional ainda não recebeu avaliações.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {provider.reviews.map((review) => (
              <li key={review.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-ink">{review.customerName ?? "Cliente"}</p>
                  <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                </div>
                <Stars value={review.rating} size={14} />
                {review.comment ? <p className="mt-2 text-sm text-slate-600">{review.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/prestadores" className="font-medium text-primary hover:underline">
          Ver outros profissionais
        </Link>
      </p>
    </div>
  );
}
