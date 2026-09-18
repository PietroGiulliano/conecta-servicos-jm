import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Card, Field, Input } from "@/components/ui";
import { Logo } from "@/components/Logo";
import * as authService from "@/services/auth.service";
import { getErrorMessage, isMissingEndpoint } from "@/utils/errors";

const schema = z
  .object({
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "As senhas não são iguais.",
  });
type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await authService.resetPassword(token, values.password);
      setDone(true);
    } catch (error) {
      setFormError(
        isMissingEndpoint(error)
          ? "A redefinição de senha ainda não está disponível. Fale com o suporte para recuperar seu acesso."
          : getErrorMessage(error, "Não foi possível redefinir sua senha.")
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo />
          <h1 className="mt-6 text-2xl font-bold text-ink">Criar nova senha</h1>
        </div>
        <Card className="p-6">
          {done ? (
            <div className="text-center">
              <p className="text-sm text-slate-600">Senha alterada. Você já pode entrar com a nova senha.</p>
              <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">
                Ir para o login
              </Link>
            </div>
          ) : !token ? (
            <p className="text-center text-sm text-slate-600">
              O link de redefinição está incompleto. Solicite um novo em{" "}
              <Link to="/esqueci-senha" className="font-semibold text-primary hover:underline">
                esqueci minha senha
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <Field label="Nova senha" required error={errors.password?.message}>
                <Input type="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
              </Field>
              <Field label="Confirmar nova senha" required error={errors.confirm?.message}>
                <Input type="password" autoComplete="new-password" invalid={!!errors.confirm} {...register("confirm")} />
              </Field>
              {formError ? (
                <p role="alert" className="rounded-xl bg-danger-light px-3 py-2.5 text-sm font-medium text-danger">
                  {formError}
                </p>
              ) : null}
              <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                Salvar nova senha
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
