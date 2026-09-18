import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CalendarDays, MapPin, Wallet } from "lucide-react";
import { Button, Card, ErrorState, Field, Input, Skeleton, Textarea } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { useToast } from "@/contexts/ToastContext";
import * as serviceRequestsService from "@/services/serviceRequests.service";
import * as proposalsService from "@/services/proposals.service";
import { getErrorMessage } from "@/utils/errors";
import { formatCurrency, formatDate, toIsoDate } from "@/utils/format";

const schema = z.object({
  value: z.coerce.number().positive("Informe o valor da proposta."),
  description: z.string().min(4, "Descreva o que está incluso na proposta."),
  estimatedDays: z.union([z.coerce.number().int().positive("Informe um prazo válido."), z.literal("")]).optional(),
  availableDate: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.input<typeof schema>;
type ParsedValues = z.output<typeof schema>;

/**
 * Detalhe da oportunidade. Enquanto o prestador não tem proposta enviada, o
 * backend só permite ler a solicitação pela listagem /service-requests/available
 * (GET /service-requests/:id exige ser dono, admin ou ter proposta), então os
 * dados vêm dessa listagem.
 */
export default function OportunidadeDetalhe() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useRequest(() => serviceRequestsService.listAvailable(), []);
  const [formError, setFormError] = useState<string | null>(null);

  const request = useMemo(() => (data ?? []).find((item) => item.id === id) ?? null, [data, id]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, ParsedValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: ParsedValues) {
    setFormError(null);
    try {
      await proposalsService.create({
        serviceRequestId: id,
        value: values.value,
        description: values.description,
        estimatedDays:
          values.estimatedDays === "" || values.estimatedDays === undefined ? undefined : Number(values.estimatedDays),
        availableDate: toIsoDate(values.availableDate),
        notes: values.notes || undefined,
      });
      toast.success("Proposta enviada. O cliente foi notificado.");
      navigate("/prestador/propostas");
    } catch (err) {
      setFormError(getErrorMessage(err, "Não foi possível enviar sua proposta. Tente novamente."));
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;

  if (!request) {
    return (
      <ErrorState
        message="Esta oportunidade não está mais disponível para proposta. Ela pode ter sido fechada ou você já enviou uma proposta."
        onRetry={reload}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/prestador/oportunidades" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Oportunidades
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{request.category?.name ?? "Serviço"}</p>
          <h1 className="mt-2 text-2xl font-bold text-ink">{request.title}</h1>
          <p className="mt-4 whitespace-pre-line text-slate-600">{request.description}</p>

          <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3 text-sm">
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <MapPin className="h-3.5 w-3.5" aria-hidden /> Cidade
              </dt>
              <dd className="mt-1 text-ink">{request.city}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden /> Data desejada
              </dt>
              <dd className="mt-1 text-ink">
                {formatDate(request.desiredDate)} {request.desiredTime ? `· ${request.desiredTime}` : ""}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Wallet className="h-3.5 w-3.5" aria-hidden /> Orçamento
              </dt>
              <dd className="mt-1 text-ink">{request.approxBudget ? formatCurrency(request.approxBudget) : "Aberto"}</dd>
            </div>
          </dl>

          {request.photos.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {request.photos.map((photo) => (
                <img key={photo} src={photo} alt="" className="h-28 w-full rounded-xl object-cover" />
              ))}
            </div>
          ) : null}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink">Enviar proposta</h2>
          <p className="mt-1 text-sm text-slate-500">
            A comissão da plataforma é descontada do valor quando o pedido é criado.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
            <Field label="Valor (R$)" required error={errors.value?.message}>
              <Input type="number" min={0} step="0.01" invalid={!!errors.value} {...register("value")} />
            </Field>
            <Field label="Prazo estimado (dias)" error={errors.estimatedDays?.message}>
              <Input type="number" min={1} step="1" {...register("estimatedDays")} />
            </Field>
            <Field label="Data disponível" error={errors.availableDate?.message}>
              <Input type="date" {...register("availableDate")} />
            </Field>
            <Field label="Mensagem" required error={errors.description?.message}>
              <Textarea
                placeholder="Explique o que está incluso, materiais, garantia e condições."
                invalid={!!errors.description}
                {...register("description")}
              />
            </Field>
            <Field label="Observações" error={errors.notes?.message}>
              <Input placeholder="Opcional" {...register("notes")} />
            </Field>

            {formError ? (
              <p role="alert" className="rounded-xl bg-danger-light px-3 py-2.5 text-sm font-medium text-danger">
                {formError}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              Enviar proposta
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
