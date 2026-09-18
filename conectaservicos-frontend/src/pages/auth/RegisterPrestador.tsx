import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, ErrorState, Field, Input, Select, Skeleton, Textarea } from "@/components/ui";
import { RegisterShell, estados } from "./RegisterShell";
import { homeRouteFor, useAuth } from "@/hooks/useAuth";
import { useRequest } from "@/hooks/useRequest";
import * as categoriesService from "@/services/categories.service";
import * as providersService from "@/services/providers.service";
import { getErrorMessage } from "@/utils/errors";

// Espelha registerProviderSchema do backend.
const schema = z.object({
  name: z.string().min(2, "Informe seu nome completo."),
  professionalName: z.string().min(2, "Informe seu nome profissional."),
  email: z.string().email("Informe um email válido."),
  phone: z.string().min(8, "Informe um telefone válido."),
  documentNumber: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 11 || value.length === 14, "Informe um CPF ou CNPJ válido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  categoryId: z.string().uuid("Selecione uma categoria."),
  specialties: z.string().optional(),
  bio: z.string().min(10, "Descreva sua experiência em pelo menos 10 caracteres."),
  startingPrice: z.coerce.number().nonnegative("Informe um valor válido.").default(0),
  serviceRadiusKm: z.coerce.number().int().positive("Informe um raio válido.").optional(),
  street: z.string().min(2, "Informe a rua."),
  number: z.string().optional(),
  complement: z.string().optional(),
  district: z.string().optional(),
  city: z.string().min(2, "Informe a cidade."),
  state: z.string().length(2, "Selecione o estado."),
  zipCode: z.string().min(8, "Informe o CEP completo."),
});
type FormValues = z.input<typeof schema>;
type ParsedValues = z.output<typeof schema>;

export default function RegisterPrestador() {
  const { registerProvider } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const categories = useRequest(() => categoriesService.list(), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const role = await registerProvider({
        name: values.name,
        professionalName: values.professionalName,
        email: values.email,
        phone: values.phone,
        documentNumber: values.documentNumber,
        password: values.password,
        city: values.city,
        categoryId: values.categoryId,
        specialties: (values.specialties ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        bio: values.bio,
        startingPrice: values.startingPrice ?? 0,
        address: {
          street: values.street,
          number: values.number || undefined,
          complement: values.complement || undefined,
          district: values.district || undefined,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
        },
      });

      // O cadastro do backend não recebe o raio de atendimento; ele pertence ao
      // perfil (PUT /providers/me/profile), então gravamos logo após o registro.
      if (values.serviceRadiusKm) {
        try {
          await providersService.updateMyProfile({ serviceRadiusKm: values.serviceRadiusKm });
        } catch {
          // não bloqueia o cadastro: o prestador pode ajustar depois no perfil
        }
      }

      navigate(homeRouteFor(role), { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, "Não foi possível criar sua conta de prestador."));
    }
  }

  return (
    <RegisterShell
      title="Cadastro de prestador"
      subtitle="Receba oportunidades de clientes e empresas da sua região e envie propostas."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" required error={errors.name?.message}>
            <Input autoComplete="name" invalid={!!errors.name} {...register("name")} />
          </Field>
          <Field label="Nome profissional" required error={errors.professionalName?.message} hint="Como você aparece na busca.">
            <Input invalid={!!errors.professionalName} {...register("professionalName")} />
          </Field>
          <Field label="Email" required error={errors.email?.message}>
            <Input type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
          </Field>
          <Field label="Telefone" required error={errors.phone?.message}>
            <Input inputMode="tel" invalid={!!errors.phone} {...register("phone")} />
          </Field>
          <Field label="CPF ou CNPJ" required error={errors.documentNumber?.message}>
            <Input inputMode="numeric" invalid={!!errors.documentNumber} {...register("documentNumber")} />
          </Field>
          <Field label="Senha" required error={errors.password?.message} hint="Mínimo de 8 caracteres.">
            <Input type="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
          </Field>

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
          <Field label="Especialidades" error={errors.specialties?.message} hint="Separe por vírgula. Ex.: instalação, reparo">
            <Input {...register("specialties")} />
          </Field>

          <Field label="Preço inicial (R$)" required error={errors.startingPrice?.message} hint="A partir de quanto você atende.">
            <Input type="number" min={0} step="0.01" invalid={!!errors.startingPrice} {...register("startingPrice")} />
          </Field>
          <Field label="Raio de atendimento (km)" error={errors.serviceRadiusKm?.message} hint="Ajustável depois no seu perfil.">
            <Input type="number" min={1} step="1" {...register("serviceRadiusKm")} />
          </Field>

          <Field label="Descrição" required error={errors.bio?.message} className="sm:col-span-2">
            <Textarea placeholder="Conte sua experiência, tipos de serviço e diferenciais." invalid={!!errors.bio} {...register("bio")} />
          </Field>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Endereço</h2>
          <div className="grid gap-4 sm:grid-cols-6">
            <Field label="Rua" required error={errors.street?.message} className="sm:col-span-4">
              <Input invalid={!!errors.street} {...register("street")} />
            </Field>
            <Field label="Número" className="sm:col-span-2">
              <Input {...register("number")} />
            </Field>
            <Field label="Complemento" className="sm:col-span-3">
              <Input {...register("complement")} />
            </Field>
            <Field label="Bairro" className="sm:col-span-3">
              <Input {...register("district")} />
            </Field>
            <Field label="Cidade" required error={errors.city?.message} className="sm:col-span-3">
              <Input invalid={!!errors.city} {...register("city")} />
            </Field>
            <Field label="Estado" required error={errors.state?.message} className="sm:col-span-1">
              <Select invalid={!!errors.state} defaultValue="" {...register("state")}>
                <option value="" disabled>UF</option>
                {estados.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </Select>
            </Field>
            <Field label="CEP" required error={errors.zipCode?.message} className="sm:col-span-2">
              <Input inputMode="numeric" invalid={!!errors.zipCode} {...register("zipCode")} />
            </Field>
          </div>
        </div>

        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-primary">
          Seu cadastro passa por aprovação antes de aparecer nas buscas. Enquanto isso, você já pode conectar sua conta
          Mercado Pago para receber pagamentos.
        </p>

        {formError ? (
          <p role="alert" className="rounded-xl bg-danger-light px-3 py-2.5 text-sm font-medium text-danger">
            {formError}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full sm:w-auto" loading={isSubmitting}>
          Criar conta de prestador
        </Button>
      </form>
    </RegisterShell>
  );
}
