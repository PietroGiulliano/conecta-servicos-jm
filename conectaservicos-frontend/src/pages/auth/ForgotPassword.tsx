import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { Button, Card, Field, Input } from "@/components/ui";
import { Logo } from "@/components/Logo";
import * as authService from "@/services/auth.service";
import { getErrorMessage } from "@/utils/errors";

const schema = z.object({ email: z.string().min(1, "Informe seu email.").email("Informe um email válido.") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const result = await authService.forgotPassword(values.email);
      setSent(result.message);
    } catch (error) {
      setFormError(getErrorMessage(error, "Não foi possível enviar as instruções agora."));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo />
          <h1 className="mt-6 text-2xl font-bold text-ink">Recuperar acesso</h1>
          <p className="mt-1 text-sm text-slate-500">Informe o email da conta e enviaremos as instruções.</p>
        </div>
        <Card className="p-6">
          {sent ? (
            <div className="text-center">
              <MailCheck className="mx-auto mb-3 h-10 w-10 text-success" aria-hidden />
              <p className="text-sm text-slate-600">{sent}</p>
              <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <Field label="Email" required error={errors.email?.message}>
                <Input type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
              </Field>
              {formError ? (
                <p role="alert" className="rounded-xl bg-danger-light px-3 py-2.5 text-sm font-medium text-danger">
                  {formError}
                </p>
              ) : null}
              <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                Enviar instruções
              </Button>
              <Link to="/login" className="block text-center text-sm text-slate-600 hover:text-primary">
                Voltar para o login
              </Link>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
