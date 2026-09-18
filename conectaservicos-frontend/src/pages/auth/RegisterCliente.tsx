import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Field, Input, Select } from "@/components/ui";
import { RegisterShell, estados } from "./RegisterShell";
import { homeRouteFor, useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/utils/errors";

// Espelha registerCustomerSchema do backend (auth.schemas.ts).
const schema = z.object({
  name: z.string().min(2, "Informe seu nome completo."),
  email: z.string().email("Informe um email válido."),
  phone: z.string().min(8, "Informe um telefone válido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  street: z.string().min(2, "Informe a rua."),
  number: z.string().optional(),
  complement: z.string().optional(),
  district: z.string().optional(),
  city: z.string().min(2, "Informe a cidade."),
  state: z.string().length(2, "Selecione o estado."),
  zipCode: z.string().min(8, "Informe o CEP completo."),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterCliente() {
  const { registerCustomer } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const role = await registerCustomer({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        city: values.city,
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
      setFormError(getErrorMessage(error, "Não foi possível criar sua conta."));
    }
  }

  return (
    <RegisterShell title="Criar conta de cliente" subtitle="Publique o que você precisa e receba propostas de profissionais.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" required error={errors.name?.message} className="sm:col-span-2">
            <Input invalid={!!errors.name} autoComplete="name" {...register("name")} />
          </Field>
          <Field label="Email" required error={errors.email?.message}>
            <Input type="email" invalid={!!errors.email} autoComplete="email" {...register("email")} />
          </Field>
          <Field label="Telefone" required error={errors.phone?.message}>
            <Input inputMode="tel" placeholder="(31) 99999-0000" invalid={!!errors.phone} {...register("phone")} />
          </Field>
          <Field label="Senha" required error={errors.password?.message} hint="Mínimo de 8 caracteres.">
            <Input type="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
          </Field>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Endereço</h2>
          <div className="grid gap-4 sm:grid-cols-6">
            <Field label="Rua" required error={errors.street?.message} className="sm:col-span-4">
              <Input invalid={!!errors.street} {...register("street")} />
            </Field>
            <Field label="Número" error={errors.number?.message} className="sm:col-span-2">
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
              <Input inputMode="numeric" placeholder="00000-000" invalid={!!errors.zipCode} {...register("zipCode")} />
            </Field>
          </div>
        </div>

        {formError ? (
          <p role="alert" className="rounded-xl bg-danger-light px-3 py-2.5 text-sm font-medium text-danger">
            {formError}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full sm:w-auto" loading={isSubmitting}>
          Criar conta
        </Button>
      </form>
    </RegisterShell>
  );
}
