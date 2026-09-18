import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Button, Card, ErrorState, Field, Input, Select, Skeleton, Textarea } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import * as categoriesService from "@/services/categories.service";
import * as serviceRequestsService from "@/services/serviceRequests.service";
import { getErrorMessage } from "@/utils/errors";
import { toIsoDate } from "@/utils/format";

const schema = z.object({
  categoryId: z.string().uuid("Selecione uma categoria."),
  title: z.string().min(4, "O título precisa ter ao menos 4 caracteres."),
  description: z.string().min(10, "Descreva o serviço com pelo menos 10 caracteres."),
  city: z.string().min(2, "Informe a cidade."),
  desiredDate: z.string().optional(),
  desiredTime: z.string().optional(),
  approxBudget: z.union([z.coerce.number().nonnegative("Informe um valor válido."), z.literal("")]).optional(),
  urgency: z.enum(["NORMAL", "ESTA_SEMANA", "URGENTE"]).default("NORMAL"),
  photos: z.array(z.object({ url: z.string().url("Informe uma URL de imagem válida.") })).default([]),
});
type FormValues = z.input<typeof schema>;
type ParsedValues = z.output<typeof schema>;

const urgencyNote: Record<ParsedValues["urgency"], string> = {
  NORMAL: "",
  ESTA_SEMANA: "Preferência de atendimento ainda esta semana.",
  URGENTE: "Atendimento urgente.",
};

/** Formulário de nova solicitação — usado por cliente e por empresa. */
export function NovaSolicitacao({ basePath }: { basePath: "/cliente" | "/empresa" }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const targetProviderId = params.get("prestador") ?? undefined;
  const toast = useToast();
  const { user } = useAuth();
  const categories = useRequest(() => categoriesService.list(), []);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; title: string } | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { urgency: "NORMAL", photos: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "photos" });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const note = urgencyNote[values.urgency ?? "NORMAL"];
      const request = await serviceRequestsService.create({
        categoryId: values.categoryId,
        title: values.title,
        description: note ? `${values.description}\n\n${note}` : values.description,
        photos: (values.photos ?? []).map((photo) => photo.url),
        city: values.city,
        desiredDate: toIsoDate(values.desiredDate),
        desiredTime: values.desiredTime || undefined,
        approxBudget: values.approxBudget === "" || values.approxBudget === undefined ? undefined : Number(values.approxBudget),
        targetProviderId,
      });
      setCreated({ id: request.id, title: request.title });
      toast.success("Solicitação publicada. Os profissionais compatíveis já foram avisados.");
    } catch (error) {
      setFormError(getErrorMessage(error, "Não foi possível publicar sua solicitação. Tente novamente."));
    }
  }

  if (created) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
        <h1 className="mt-4 text-xl font-bold text-ink">Solicitação publicada</h1>
        <p className="mt-2 text-sm text-slate-600">
          “{created.title}” está no ar. Assim que chegarem propostas, você recebe uma notificação.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate(`${basePath}/solicitacoes/${created.id}`)}>Ver solicitação</Button>
          <Button variant="outline" onClick={() => navigate(`${basePath}/solicitacoes`)}>
            Ver todas
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-ink">Nova solicitação</h1>
      <p className="mt-1 text-sm text-slate-500">
        {targetProviderId
          ? "Esta solicitação será enviada diretamente ao profissional escolhido."
          : "Descreva o serviço. Profissionais da categoria e da cidade recebem sua solicitação."}
      </p>

      <Card className="mt-6 p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoria" required error={errors.categoryId?.message}>
              {categories.loading ? (
                <Skeleton className="h-11 w-full" />
              ) : categories.error ? (
                <ErrorState message="Não foi possível carregar as categorias." onRetry={categories.reload} />
              ) : (
                <Select invalid={!!errors.categoryId} defaultValue="" {...register("categoryId")}>
                  <option value="" disabled>Selecione</option>
                  {(categories.data ?? []).map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Cidade do serviço" required error={errors.city?.message}>
              <Input placeholder="Onde o serviço será feito" invalid={!!errors.city} {...register("city")} />
            </Field>
            <Field label="Título" required error={errors.title?.message} className="sm:col-span-2">
              <Input placeholder="Ex.: Instalação de 6 luminárias no salão" invalid={!!errors.title} {...register("title")} />
            </Field>
            <Field label="Descrição" required error={errors.description?.message} className="sm:col-span-2">
              <Textarea
                placeholder="Explique o que precisa ser feito, o local, materiais e qualquer detalhe importante."
                invalid={!!errors.description}
                {...register("description")}
              />
            </Field>
            <Field label="Data desejada" error={errors.desiredDate?.message}>
              <Input type="date" {...register("desiredDate")} />
            </Field>
            <Field label="Horário" error={errors.desiredTime?.message}>
              <Input placeholder="Ex.: manhã, 14h" {...register("desiredTime")} />
            </Field>
            <Field label="Orçamento aproximado (R$)" error={errors.approxBudget?.message} hint="Opcional. Ajuda o profissional a calibrar a proposta.">
              <Input type="number" min={0} step="0.01" {...register("approxBudget")} />
            </Field>
            <Field label="Urgência">
              <Select {...register("urgency")}>
                <option value="NORMAL">Sem pressa</option>
                <option value="ESTA_SEMANA">Ainda esta semana</option>
                <option value="URGENTE">Urgente</option>
              </Select>
            </Field>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">Fotos</span>
              <Button type="button" variant="ghost" size="sm" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => append({ url: "" })}>
                Adicionar foto
              </Button>
            </div>
            <p className="mb-3 text-sm text-slate-500">
              Cole o link público de cada imagem. O backend armazena as fotos como URLs.
            </p>
            {fields.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500">
                Nenhuma foto adicionada.
              </p>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="https://..."
                        invalid={!!errors.photos?.[index]?.url}
                        {...register(`photos.${index}.url` as const)}
                      />
                      {errors.photos?.[index]?.url ? (
                        <span className="mt-1 block text-sm text-danger">{errors.photos[index]?.url?.message}</span>
                      ) : null}
                    </div>
                    <Button type="button" variant="ghost" size="md" aria-label="Remover foto" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-danger" aria-hidden />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formError ? (
            <p role="alert" className="rounded-xl bg-danger-light px-3 py-2.5 text-sm font-medium text-danger">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" loading={isSubmitting}>
              Publicar solicitação
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => navigate(`${basePath}/solicitacoes`)}>
              Cancelar
            </Button>
          </div>
          {user?.role === "EMPRESA" ? (
            <p className="text-xs text-slate-400">Publicando como {user.name}.</p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
