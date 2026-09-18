import { useEffect, useState } from "react";
import { AlertTriangle, Percent } from "lucide-react";
import { Button, Card, CardHeader, ErrorState, Field, Input, Skeleton } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { useToast } from "@/contexts/ToastContext";
import * as adminService from "@/services/admin.service";
import { getErrorMessage } from "@/utils/errors";

const presets = [5, 8, 10, 12, 15];

export default function AdminComissao() {
  const toast = useToast();
  const { data, loading, error, reload } = useRequest(() => adminService.getCommission(), []);
  const [percent, setPercent] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data !== null && data !== undefined) setPercent(String(data));
  }, [data]);

  async function salvar() {
    const value = Number(percent.replace(",", "."));
    if (Number.isNaN(value) || value < 0 || value > 100) {
      toast.error("Informe um percentual válido entre 0 e 100.");
      return;
    }
    setSaving(true);
    try {
      await adminService.setCommission(value);
      toast.success("Comissão atualizada. Ela vale apenas para novos pedidos.");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível atualizar a comissão."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Comissão da plataforma</h1>
        <p className="mt-1 text-sm text-slate-500">
          Percentual retido pelo ConectaServiços sobre cada serviço contratado.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title="Percentual atual" description="Alterações passam a valer imediatamente para novos pedidos." />
          <div className="space-y-5 p-5 pt-0">
            {loading ? (
              <Skeleton className="h-12 w-32" />
            ) : error ? (
              <ErrorState message={error} onRetry={reload} />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-ink">{data}</span>
                  <span className="text-xl font-semibold text-slate-400">%</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {presets.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPercent(String(option))}
                      className={`h-10 rounded-xl border px-4 text-sm font-semibold transition ${
                        percent === String(option)
                          ? "border-primary bg-primary-light text-primary"
                          : "border-slate-300 bg-white text-slate-600 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {option}%
                    </button>
                  ))}
                </div>

                <Field label="Novo percentual (%)" hint="Aceita valores decimais, por exemplo 9,5.">
                  <Input
                    inputMode="decimal"
                    value={percent}
                    onChange={(event) => setPercent(event.target.value)}
                    placeholder="10"
                  />
                </Field>

                <Button type="button" onClick={salvar} loading={saving} icon={<Percent className="h-4 w-4" />}>
                  Salvar
                </Button>
              </>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">A nova comissão será aplicada somente a novos pedidos.</p>
              <p className="mt-2 text-sm text-slate-500">
                Pedidos já criados mantêm a comissão congelada no momento da aceitação da proposta. Nenhum valor
                financeiro é recalculado pelo painel.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
