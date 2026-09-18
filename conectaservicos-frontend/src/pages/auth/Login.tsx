import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Card, Field, Input } from "@/components/ui";
import { Logo } from "@/components/Logo";
import { homeRouteFor, useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/utils/errors";

const schema = z.object({
  email: z.string().min(1, "Informe seu email.").email("Informe um email válido."),
  password: z.string().min(1, "Informe sua senha."),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const role = await login(values.email, values.password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? homeRouteFor(role), { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, "Não foi possível entrar. Verifique seu email e senha."));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo />
          <h1 className="mt-6 text-2xl font-bold text-ink">Entrar na sua conta</h1>
          <p className="mt-1 text-sm text-slate-500">Conectando quem precisa a quem sabe fazer.</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Field label="Email" required error={errors.email?.message}>
              <Input type="email" autoComplete="email" placeholder="voce@email.com" invalid={!!errors.email} {...register("email")} />
            </Field>
            <Field label="Senha" required error={errors.password?.message}>
              <Input type="password" autoComplete="current-password" placeholder="••••••••" invalid={!!errors.password} {...register("password")} />
            </Field>

            {formError ? (
              <p role="alert" className="rounded-xl bg-danger-light px-3 py-2.5 text-sm font-medium text-danger">
                {formError}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              Entrar
            </Button>
          </form>

          <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm">
            <Link to="/esqueci-senha" className="font-medium text-primary hover:underline">
              Esqueci minha senha
            </Link>
            <Link to="/cadastro" className="text-slate-600 hover:text-primary">
              Ainda não tem conta? <span className="font-medium text-primary">Criar conta</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
