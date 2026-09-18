import { useState } from "react";
import { Button, Card, EmptyState, ErrorState, Select, SkeletonRows } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { useRequest } from "@/hooks/useRequest";
import { useToast } from "@/contexts/ToastContext";
import * as adminService from "@/services/admin.service";
import { getErrorMessage } from "@/utils/errors";
import { formatDate } from "@/utils/format";
import type { UserRole, UserStatus } from "@/types/api";

export default function AdminUsuarios() {
  const toast = useToast();
  const [role, setRole] = useState<UserRole | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, loading, error, reload } = useRequest(
    () =>
      adminService.listUsers({
        role: role || undefined,
        status: status || undefined,
        page,
        pageSize: 20,
      }),
    [role, status, page]
  );

  async function alterar(id: string, bloquear: boolean) {
    setBusyId(id);
    try {
      if (bloquear) await adminService.blockUser(id);
      else await adminService.unblockUser(id);
      toast.success(bloquear ? "Usuário bloqueado." : "Usuário desbloqueado.");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível atualizar o usuário."));
    } finally {
      setBusyId(null);
    }
  }

  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Usuários</h1>
        <p className="mt-1 text-sm text-slate-500">{total} usuários cadastrados.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-44">
          <Select value={role} onChange={(event) => { setPage(1); setRole(event.target.value as UserRole | ""); }} aria-label="Papel">
            <option value="">Todos os papéis</option>
            <option value="CLIENTE">Cliente</option>
            <option value="EMPRESA">Empresa</option>
            <option value="PRESTADOR">Prestador</option>
            <option value="ADMIN">Administrador</option>
          </Select>
        </div>
        <div className="w-52">
          <Select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as UserStatus | ""); }} aria-label="Status">
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativo</option>
            <option value="BLOQUEADO">Bloqueado</option>
            <option value="PENDENTE_VERIFICACAO">Verificação pendente</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <SkeletonRows count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (data?.data.length ?? 0) === 0 ? (
        <EmptyState title="Nenhum usuário encontrado." description="Ajuste os filtros para ver outros registros." />
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Papel</th>
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
                    <td className="px-5 py-3.5 text-slate-600">{user.role}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={user.status} /></td>
                    <td className="px-5 py-3.5 text-slate-600">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {user.status === "BLOQUEADO" ? (
                        <Button size="sm" variant="outline" loading={busyId === user.id} onClick={() => alterar(user.id, false)}>
                          Desbloquear
                        </Button>
                      ) : (
                        <Button size="sm" variant="danger" loading={busyId === user.id} onClick={() => alterar(user.id, true)}>
                          Bloquear
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</Button>
              <span className="text-sm text-slate-500">Página {page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Próxima</Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
