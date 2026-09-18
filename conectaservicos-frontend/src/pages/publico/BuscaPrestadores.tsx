import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";
import { Button, Card, EmptyState, ErrorState, Field, Input, Select, SkeletonCards, Stars } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import * as categoriesService from "@/services/categories.service";
import * as providersService from "@/services/providers.service";
import { formatCurrency, formatRating, initials, toNumber } from "@/utils/format";

export default function BuscaPrestadores() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      categorySlug: params.get("categoria") || undefined,
      city: params.get("cidade") || undefined,
      minRating: params.get("nota") ? Number(params.get("nota")) : undefined,
      maxPrice: params.get("preco") ? Number(params.get("preco")) : undefined,
      page,
      pageSize: 12,
    }),
    [params, page]
  );

  const categories = useRequest(() => categoriesService.list(), []);
  const providers = useRequest(() => providersService.search(filters), [JSON.stringify(filters)]);

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setPage(1);
    setParams(next);
  }

  const total = providers.data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 12));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">Profissionais disponíveis</h1>
      <p className="mt-1 text-slate-600">Filtre por categoria, cidade, avaliação e preço inicial.</p>

      <Card className="mt-6 p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filtros
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Categoria">
            <Select value={params.get("categoria") ?? ""} onChange={(event) => updateFilter("categoria", event.target.value)}>
              <option value="">Todas</option>
              {(categories.data ?? []).map((category) => (
                <option key={category.id} value={category.slug}>{category.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Cidade">
            <Input
              placeholder="Ex.: João Monlevade"
              defaultValue={params.get("cidade") ?? ""}
              onBlur={(event) => updateFilter("cidade", event.target.value)}
            />
          </Field>
          <Field label="Avaliação mínima">
            <Select value={params.get("nota") ?? ""} onChange={(event) => updateFilter("nota", event.target.value)}>
              <option value="">Qualquer</option>
              <option value="3">3 estrelas ou mais</option>
              <option value="4">4 estrelas ou mais</option>
              <option value="4.5">4,5 estrelas ou mais</option>
            </Select>
          </Field>
          <Field label="Preço inicial até (R$)">
            <Input
              type="number"
              min={0}
              step="10"
              defaultValue={params.get("preco") ?? ""}
              onBlur={(event) => updateFilter("preco", event.target.value)}
            />
          </Field>
        </div>
      </Card>

      <div className="mt-8">
        {providers.loading ? (
          <SkeletonCards count={6} />
        ) : providers.error ? (
          <ErrorState message={providers.error} onRetry={providers.reload} />
        ) : (providers.data?.data.length ?? 0) === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" aria-hidden />}
            title="Nenhum profissional encontrado"
            description="Tente outra categoria ou remova os filtros de cidade e preço."
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-500">
              {total} profissional{total === 1 ? "" : "is"} encontrado{total === 1 ? "" : "s"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(providers.data?.data ?? []).map((provider) => (
                <Card key={provider.id} className="flex flex-col p-5">
                  <div className="flex items-center gap-3">
                    {provider.photoUrl ? (
                      <img src={provider.photoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
                        {initials(provider.professionalName)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{provider.professionalName}</p>
                      <p className="truncate text-sm text-slate-500">{provider.category ?? "Sem categoria"}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <Stars value={toNumber(provider.ratingAverage)} />
                    <span className="text-slate-500">
                      {formatRating(provider.ratingAverage)} ({provider.ratingCount})
                    </span>
                  </div>

                  {provider.bio ? <p className="mt-3 line-clamp-3 text-sm text-slate-600">{provider.bio}</p> : null}

                  {provider.citiesServed.length > 0 ? (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="h-4 w-4" aria-hidden />
                      {provider.citiesServed.slice(0, 2).join(", ")}
                    </p>
                  ) : null}

                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <div>
                      <p className="text-xs text-slate-500">A partir de</p>
                      <p className="font-bold text-ink">{formatCurrency(provider.startingPrice)}</p>
                    </div>
                    <Link to={`/prestadores/${provider.id}`}>
                      <Button variant="outline" size="sm">Ver perfil</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                  Anterior
                </Button>
                <span className="text-sm text-slate-500">
                  Página {page} de {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
                  Próxima
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
