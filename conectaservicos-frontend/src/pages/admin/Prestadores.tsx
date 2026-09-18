import { useState } from "react";
import { Button, Card, CardHeader, EmptyState, ErrorState, SkeletonRows } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { useRequest } from "@/hooks/useRequest";
import { useToast } from "@/contexts/ToastContext";
import * as adminService from "@/services/admin.service";
import { getErrorMessage } from "@/utils/errors";
import { formatCurrency, formatDate, formatRating } from "@/utils/format";

export default function AdminPrestadores() {
  const toast = useToast();
  const pendentes = useRequest(() => adminService.listPendingProviders(), []);
  const usuarios = useRequest(() => adminService.listUsers({ role: "PRESTADOR", pageSize: 50 }), []);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decidir(id: string, aprovar: boolean) {
    setBusyId(id);
    try {
      if (aprovar) await adminService.approveProvider(id);
      else await adminService.rejectProvider(id);
      toast.success(aprovar ? "Prestador aprovado." : "Cadastro reprovado.");
      await Promise.all([pendentes.reload(), usuarios.reload()]);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível concluir a análise."));
    } finally {
      setBusyId(null);
    }
  }

  async function alterarAcesso(id: string, bloquear: boolean) {
    setBusyId(id);
    try {
      if (bloquear) await adminService.blockUser(id);
      else await adminService.unblockUser(id);
      toast.success(bloquear ? "Prestador bloqueado." : "Prestador desbloqueado.");
      await usuarios.reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível atualizar o acesso."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Prestadores</h1>
        <p className="mt-1 text-sm text-slate-500">Analise cadastros novos e controle o acesso dos profissionais.</p>
      </div>

      <Card>
        <CardHeader title="Aguardando aprovação" description="Cadastros que ainda não aparecem nas buscas" />
        <div className="p-5">
          {pendentes.loading ? (
            <SkeletonRows count={3} />
          ) : pendentes.error ? (
            <ErrorState message={pendentes.error} onRetry={pendentes.reload} />
          ) : (pendentes.data?.length ?? 0) === 0 ? (
            <EmptyState title="Nenhum cadastro pendente." description="Todos os prestadores já foram analisados." />
          ) : (
            <ul className="space-y-4">
              {(pendentes.data ?? []).map((provider) => (
                <li key={provider.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{provider.professionalName}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {provider.user?.name ?? ""} · {provider.user?.email ?? ""}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {provider.category?.name ?? "Sem categoria"} · {provider.citiesServed.join(", ") || "Sem cidade"} ·
                        A partir de {formatCurrency(provider.startingPrice)}
                      </p>
                      {provider.bio ? <p className="mt-2 line-clamp-2 text-sm text-slate-600">{provider.bio}</p> : null}
                      <p className="mt-2 text-xs text-slate-400">
                        Cadastro em {formatDate(provider.createdAt)} ·{" "}
                        {provider.documents?.length ?? 0} documento(s) enviado(s) ·{" "}
                        {provider.paymentAccountId ? "conta de pagamento conectada" : "sem conta de pagamento"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" loading={busyId === provider.id} onClick={() => decidir(provider.id, true)}>
                        Aprovar
                      </Button>
                      <Button size="sm" variant="outline" loading={busyId === provider.id} onClick={() => decidir(provider.id, false)}>
                        Reprovar
                      </Button>
                    </div>
                  </div>

                  {provider.documents && provider.documents.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      {provider.documents.map((document) => (
                        <li key={document.id}>
                          <a
                            href={document.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-primary hover:text-primary"
                          >
                            {document.type} {document.verified ? "· verificado" : ""}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Todos os prestadores"
          description="Dados de conta vindos de /admin/users. Categoria, avaliação e conta de pagamento por prestador dependem de GET /api/admin/providers (ver README)."
        />
        <div className="overflow-x-auto">
          {usuarios.loading ? (
            <div className="p-5"><SkeletonRows count={4} /></div>
          ) : usuarios.error ? (
            <div className="p-5"><ErrorState message={usuarios.error} onRetry={usuarios.reload} /></div>
          ) : (usuarios.data?.data.length ?? 0) === 0 ? (
            <div className="p-5"><EmptyState title="Nenhum prestador cadastrado ainda." /></div>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Cadastro</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(usuarios.data?.data ?? []).map((user) => (
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
