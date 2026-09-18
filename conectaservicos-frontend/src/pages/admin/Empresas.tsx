import { useState } from "react";
import { Button, Card, CardHeader, EmptyState, ErrorState, SkeletonRows } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { useRequest } from "@/hooks/useRequest";
import { useToast } from "@/contexts/ToastContext";
import * as adminService from "@/services/admin.service";
import { getErrorMessage } from "@/utils/errors";
import { formatDate } from "@/utils/format";

export default function AdminEmpresas() {
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, loading, error, reload } = useRequest(() => adminService.listUsers({ role: "EMPRESA", pageSize: 50 }), []);

  async function alterarAcesso(id: string, bloquear: boolean) {
    setBusyId(id);
    try {
      if (bloquear) await adminService.blockUser(id);
      else await adminService.unblockUser(id);
      toast.success(bloquear ? "Empresa bloqueada." : "Empresa desbloqueada.");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível atualizar o acesso."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Empresas</h1>
        <p className="mt-1 text-sm text-slate-500">Contas empresariais cadastradas na plataforma.</p>
      </div>

      <Card>
        <CardHeader
          title="Contas"
          description="CNPJ, cidade, segmento e serviços publicados por empresa dependem de GET /api/admin/companies (ver README)."
        />
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5"><SkeletonRows count={4} /></div>
          ) : error ? (
            <div className="p-5"><ErrorState message={error} onRetry={reload} /></div>
          ) : (data?.data.length ?? 0) === 0 ? (
            <div className="p-5"><EmptyState title="Nenhuma empresa cadastrada ainda." /></div>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Responsável</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Cadastro</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.data ?? []).map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-medium text-ink">{user.name}</td>
                    <td className="px-5 py-3.5 text-slate-600">{user.email}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={user.status} /></td>
                    <td className="px-5 py-3.5 text-slate-600">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {user.status === "BLOQUEADO" ? (
                        <Button size="sm" variant="outline" loading={busyId === user.id} onClick={() => alterarAcesso(user.id, false)}>
                          Desbloquear
                        </Button>
                      ) : (
                        <Button size="sm" variant="danger" loading={busyId === user.id} onClick={() => alterarAcesso(user.id, true)}>
                          Bloquear
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
