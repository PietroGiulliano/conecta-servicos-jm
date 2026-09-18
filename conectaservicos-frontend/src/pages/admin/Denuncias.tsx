import { useState } from "react";
import { Button, Card, CardHeader, EmptyState, ErrorState, Field, Select, SkeletonRows, Textarea } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/StatusBadge";
import { useRequest } from "@/hooks/useRequest";
import { useToast } from "@/contexts/ToastContext";
import * as adminService from "@/services/admin.service";
import type { Dispute } from "@/services/admin.service";
import { getErrorMessage } from "@/utils/errors";
import { formatDateTime } from "@/utils/format";

export default function AdminDenuncias() {
  const toast = useToast();
  const { data, loading, error, reload } = useRequest(() => adminService.listDisputes(), []);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState("");
  const [status, setStatus] = useState<"RESOLVIDA" | "REJEITADA">("RESOLVIDA");
  const [saving, setSaving] = useState(false);

  function abrir(dispute: Dispute) {
    setSelected(dispute);
    setResolution("");
    setStatus("RESOLVIDA");
  }

  async function resolver() {
    if (!selected) return;
    if (resolution.trim().length < 10) {
      toast.error("Descreva a resolução com pelo menos 10 caracteres.");
      return;
    }
    setSaving(true);
    try {
      await adminService.resolveDispute(selected.id, { resolution: resolution.trim(), status });
      toast.success("Denúncia atualizada.");
      setSelected(null);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível resolver a denúncia."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Denúncias</h1>
        <p className="mt-1 text-sm text-slate-500">
          Disputas abertas sobre pedidos. Estornos e liberações continuam sendo decididos pelo backend.
        </p>
      </div>

      <Card>
        <CardHeader title="Ocorrências" description="Analise o relato e registre a decisão da plataforma." />
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5">
              <SkeletonRows count={4} />
            </div>
          ) : error ? (
            <div className="p-5">
              <ErrorState message={error} onRetry={reload} />
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="p-5">
              <EmptyState title="Nenhuma denúncia registrada." description="Tudo tranquilo por aqui." />
            </div>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Pedido</th>
                  <th className="px-5 py-3">Motivo</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Abertura</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data ?? []).map((dispute) => (
                  <tr key={dispute.id}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{dispute.orderId.slice(0, 8)}</td>
                    <td className="max-w-md px-5 py-3 text-slate-700">
                      <p className="line-clamp-2">{dispute.reason}</p>
                      {dispute.resolution ? (
                        <p className="mt-1 text-xs text-slate-400">Resolução: {dispute.resolution}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={dispute.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDateTime(dispute.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      {dispute.status === "ABERTA" || dispute.status === "EM_ANALISE" ? (
                        <Button size="sm" variant="outline" onClick={() => abrir(dispute)}>
                          Resolver
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">Encerrada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Resolver denúncia"
        description="O parecer registrado fica associado ao pedido."
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            <Button onClick={resolver} loading={saving}>
              Confirmar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {selected ? (
            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{selected.reason}</p>
          ) : null}
          <Field label="Decisão">
            <Select value={status} onChange={(event) => setStatus(event.target.value as "RESOLVIDA" | "REJEITADA")}>
              <option value="RESOLVIDA">Procedente — resolvida</option>
              <option value="REJEITADA">Improcedente — rejeitada</option>
            </Select>
          </Field>
          <Field label="Parecer" required>
            <Textarea
              rows={4}
              value={resolution}
              onChange={(event) => setResolution(event.target.value)}
              placeholder="Descreva a análise e a decisão tomada."
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
