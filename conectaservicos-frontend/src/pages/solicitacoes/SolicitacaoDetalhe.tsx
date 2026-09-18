import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, MessageSquare, Wallet } from "lucide-react";
import { Button, Card, CardHeader, EmptyState, ErrorState, Skeleton, Stars } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/StatusBadge";
import { ServiceTimeline } from "@/components/ServiceTimeline";
import { AvaliacaoForm } from "@/components/AvaliacaoForm";
import { useRequest } from "@/hooks/useRequest";
import { useToast } from "@/contexts/ToastContext";
import * as serviceRequestsService from "@/services/serviceRequests.service";
import * as proposalsService from "@/services/proposals.service";
import * as ordersService from "@/services/orders.service";
import { getErrorMessage } from "@/utils/errors";
import { formatCurrency, formatDate, formatRating, initials, toNumber } from "@/utils/format";
import type { Proposal } from "@/types/api";

/** Detalhe da solicitação para cliente e empresa, incluindo propostas recebidas. */
export function SolicitacaoDetalhe({ basePath }: { basePath: "/cliente" | "/empresa" }) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: request, loading, error, reload } = useRequest(() => serviceRequestsService.getById(id), [id]);

  const [proposalToAccept, setProposalToAccept] = useState<Proposal | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);

  async function acceptProposal() {
    if (!proposalToAccept) return;
    setAccepting(true);
    try {
      const order = await proposalsService.accept(proposalToAccept.id);
      toast.success("Proposta aceita. Falta só o pagamento para o profissional começar.");
      navigate(`/checkout/${order.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível aceitar a proposta."));
    } finally {
      setAccepting(false);
      setProposalToAccept(null);
    }
  }

  async function completeService() {
    if (!request?.order) return;
    setCompleting(true);
    try {
      await ordersService.complete(request.order.id);
      toast.success("Serviço concluído. O valor foi liberado para o profissional.");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível concluir o serviço."));
    } finally {
      setCompleting(false);
      setConfirmComplete(false);
    }
  }

  async function cancelRequest() {
    setCanceling(true);
    try {
      await serviceRequestsService.cancel(id);
      toast.success("Solicitação cancelada.");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível cancelar a solicitação."));
    } finally {
      setCanceling(false);
      setConfirmCancel(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !request) {
    return <ErrorState message={error ?? "Solicitação não encontrada."} onRetry={reload} />;
  }

  const proposals = request.proposals ?? [];
  const order = request.order;
  const payment = order?.payment;
  const canCancel = !["CONCLUIDO", "CANCELADO", "ESTORNADO", "PAGAMENTO_APROVADO", "EM_ANDAMENTO"].includes(request.status);

  return (
    <div className="space-y-6">
      <Link to={`${basePath}/solicitacoes`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Minhas solicitações
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-ink">{request.title}</h1>
                <p className="mt-1 text-sm text-slate-500">{request.category?.name ?? "Sem categoria"}</p>
              </div>
              <StatusBadge status={request.status} />
            </div>

            <p className="mt-5 whitespace-pre-line text-slate-600">{request.description}</p>

            <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <MapPin className="h-3.5 w-3.5" aria-hidden /> Local
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {request.address
                    ? `${request.address.street}${request.address.number ? `, ${request.address.number}` : ""} — ${request.address.city}/${request.address.state}`
                    : request.city}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden /> Data desejada
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {formatDate(request.desiredDate)} {request.desiredTime ? `· ${request.desiredTime}` : ""}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Wallet className="h-3.5 w-3.5" aria-hidden /> Orçamento informado
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {request.approxBudget ? formatCurrency(request.approxBudget) : "Não informado"}
                </dd>
              </div>
            </dl>

            {request.photos.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {request.photos.map((photo) => (
                  <img key={photo} src={photo} alt="" className="h-28 w-full rounded-xl object-cover" />
                ))}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              <Link to={`/chat/${request.id}`}>
                <Button variant="outline" icon={<MessageSquare className="h-4 w-4" aria-hidden />}>
                  Abrir conversa
                </Button>
              </Link>
              {canCancel ? (
                <Button variant="ghost" onClick={() => setConfirmCancel(true)}>
                  Cancelar solicitação
                </Button>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Propostas recebidas"
              description={proposals.length === 0 ? "Nenhuma proposta ainda." : `${proposals.length} proposta(s)`}
            />
            {proposals.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="Aguardando propostas"
                  description="Os profissionais compatíveis já foram notificados. Você recebe um aviso assim que a primeira proposta chegar."
                />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {proposals.map((proposal) => (
                  <li key={proposal.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        {proposal.provider?.photoUrl ? (
                          <img src={proposal.provider.photoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
                            {initials(proposal.provider?.professionalName)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-ink">{proposal.provider?.professionalName ?? "Profissional"}</p>
                            <StatusBadge status={proposal.status} />
                          </div>
                          {proposal.provider ? (
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                              <Stars value={toNumber(proposal.provider.ratingAverage)} size={14} />
                              {formatRating(proposal.provider.ratingAverage)} ({proposal.provider.ratingCount} avaliações)
                            </p>
                          ) : null}
                          <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{proposal.description}</p>
                          {proposal.notes ? <p className="mt-1 text-sm text-slate-500">{proposal.notes}</p> : null}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-500">Valor proposto</p>
                        <p className="text-xl font-bold text-ink">{formatCurrency(proposal.value)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {proposal.estimatedDays ? `Prazo: ${proposal.estimatedDays} dia(s)` : "Prazo não informado"}
                        </p>
                        {proposal.availableDate ? (
                          <p className="text-xs text-slate-500">Disponível em {formatDate(proposal.availableDate)}</p>
                        ) : null}
                      </div>
                    </div>

                    {proposal.status === "ENVIADA" && !order ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button onClick={() => setProposalToAccept(proposal)}>Aceitar proposta</Button>
                        <Link to={`/chat/${request.id}`}>
                          <Button variant="outline">Conversar</Button>
                        </Link>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {request.status === "CONCLUIDO" && order && !order.review && basePath === "/cliente" ? (
            <AvaliacaoForm orderId={order.id} onDone={reload} />
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-semibold text-ink">Andamento</h2>
            <div className="mt-4">
              <ServiceTimeline status={request.status} />
            </div>
          </Card>

          {order ? (
            <Card className="p-6">
              <h2 className="text-base font-semibold text-ink">Pedido</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Valor do serviço</dt>
                  <dd className="font-medium text-ink">{formatCurrency(order.grossAmount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Comissão ({toNumber(order.commissionRate)}%)</dt>
                  <dd className="font-medium text-ink">{formatCurrency(order.commissionAmount)}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <dt className="font-semibold text-ink">Total</dt>
                  <dd className="font-bold text-ink">{formatCurrency(order.grossAmount)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500">Pagamento</span>
                {payment ? <StatusBadge status={payment.status} /> : <span className="text-slate-500">Não iniciado</span>}
              </div>

              {(!payment || payment.status !== "APROVADO") && request.status !== "CANCELADO" ? (
                <Link to={`/checkout/${order.id}`} className="mt-5 block">
                  <Button className="w-full">Ir para o pagamento</Button>
                </Link>
              ) : null}

              {request.status === "EM_ANDAMENTO" ? (
                <Button className="mt-5 w-full" onClick={() => setConfirmComplete(true)}>
                  Confirmar conclusão do serviço
                </Button>
              ) : null}

              {request.status === "PAGAMENTO_APROVADO" ? (
                <p className="mt-5 rounded-xl bg-primary-light px-4 py-3 text-sm text-primary">
                  Pagamento aprovado. Assim que o profissional iniciar, o serviço aparece como em andamento.
                </p>
              ) : null}
            </Card>
          ) : null}
        </div>
      </div>

      <Modal
        open={Boolean(proposalToAccept)}
        onClose={() => setProposalToAccept(null)}
        title="Você deseja contratar este profissional?"
        description="As demais propostas desta solicitação serão recusadas automaticamente."
        footer={
          <>
            <Button variant="outline" onClick={() => setProposalToAccept(null)}>Voltar</Button>
            <Button loading={accepting} onClick={acceptProposal}>Aceitar e ir para o pagamento</Button>
          </>
        }
      >
        {proposalToAccept ? (
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="font-semibold text-ink">{proposalToAccept.provider?.professionalName ?? "Profissional"}</p>
            <p className="mt-1 text-slate-600">{formatCurrency(proposalToAccept.value)}</p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        title="Confirmar conclusão do serviço"
        description="Ao confirmar, o valor retido é liberado para o profissional. Confirme apenas se o serviço foi entregue."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmComplete(false)}>Voltar</Button>
            <Button loading={completing} onClick={completeService}>Confirmar conclusão</Button>
          </>
        }
      />

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancelar esta solicitação?"
        description="Solicitações com pagamento aprovado não podem ser canceladas por aqui."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmCancel(false)}>Voltar</Button>
            <Button variant="danger" loading={canceling} onClick={cancelRequest}>Cancelar solicitação</Button>
          </>
        }
      />
    </div>
  );
}
