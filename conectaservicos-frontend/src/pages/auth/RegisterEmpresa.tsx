import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { RegisterShell, estados } from "./RegisterShell";
import { homeRouteFor, useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/utils/errors";

// Espelha registerCompanySchema do backend.
const schema = z.object({
  documentNumber: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 14, "Informe um CNPJ válido (14 dígitos)."),
  legalName: z.string().min(2, "Informe a razão social."),
  tradeName: z.string().optional(),
  name: z.string().min(2, "Informe o nome do responsável."),
  email: z.string().email("Informe um email válido."),
  phone: z.string().min(8, "Informe um telefone válido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  city: z.string().min(2, "Informe a cidade."),
  state: z.string().length(2, "Selecione o estado."),
  industry: z.string().optional(),
  website: z.union([z.string().url("Informe uma URL válida, com https://"), z.literal("")]).optional(),
  description: z.string().optional(),
  street: z.string().min(2, "Informe a rua."),
  number: z.string().optional(),
  complement: z.string().optional(),
  district: z.string().optional(),
  zipCode: z.string().min(8, "Informe o CEP completo."),
});
type FormValues = z.input<typeof schema>;
type ParsedValues = z.output<typeof schema>;

export default function RegisterEmpresa() {
  const { registerCompany } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, ParsedValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: ParsedValues) {
    setFormError(null);
    try {
      const role = await registerCompany({
        name: values.name,
        legalName: values.legalName,
        tradeName: values.tradeName || undefined,
        documentNumber: values.documentNumber,
        email: values.email,
        phone: values.phone,
        password: values.password,
        city: values.city,
        state: values.state,
        industry: values.industry || undefined,
        website: values.website || undefined,
        description: values.description || undefined,
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
      navigate(homeRouteFor(role), { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, "Não foi possível cadastrar a empresa."));
    }
  }

  return (
    <RegisterShell
      title="Cadastrar empresa"
      subtitle="Publique demandas e contrate profissionais para manutenção, instalações e reparos."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CNPJ" required error={errors.documentNumber?.message}>
            <Input inputMode="numeric" placeholder="00.000.000/0000-00" invalid={!!errors.documentNumber} {...register("documentNumber")} />
          </Field>
          <Field label="Razão social" required error={errors.legalName?.message}>
            <Input invalid={!!errors.legalName} {...register("legalName")} />
          </Field>
          <Field label="Nome fantasia" error={errors.tradeName?.message}>
            <Input {...register("tradeName")} />
          </Field>
          <Field label="Segmento" error={errors.industry?.message} hint="Ex.: varejo, indústria, condomínio.">
            <Input {...register("industry")} />
          </Field>
          <Field label="Responsável pela conta" required error={errors.name?.message}>
            <Input autoComplete="name" invalid={!!errors.name} {...register("name")} />
          </Field>
          <Field label="Email" required error={errors.email?.message}>
            <Input type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
          </Field>
          <Field label="Telefone" required error={errors.phone?.message}>
            <Input inputMode="tel" invalid={!!errors.phone} {...register("phone")} />
          </Field>
          <Field label="Senha" required error={errors.password?.message} hint="Mínimo de 8 caracteres.">
            <Input type="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
          </Field>
          <Field label="Site" error={errors.website?.message} className="sm:col-span-2">
            <Input placeholder="https://suaempresa.com.br" invalid={!!errors.website} {...register("website")} />
          </Field>
          <Field label="Descrição" error={errors.description?.message} className="sm:col-span-2">
            <Textarea placeholder="Conte o que sua empresa faz e que tipo de serviço costuma contratar." {...register("description")} />
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

        {formError ? (
          <p role="alert" className="rounded-xl bg-danger-light px-3 py-2.5 text-sm font-medium text-danger">
            {formError}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full sm:w-auto" loading={isSubmitting}>
          Cadastrar empresa
        </Button>
      </form>
    </RegisterShell>
  );
}
