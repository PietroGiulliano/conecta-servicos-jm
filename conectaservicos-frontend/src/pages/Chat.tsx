import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import { Button, Card, EmptyState, ErrorState, Input, Skeleton, SkeletonRows } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { EndpointPendente } from "@/components/EndpointPendente";
import { useRequest } from "@/hooks/useRequest";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import * as serviceRequestsService from "@/services/serviceRequests.service";
import * as proposalsService from "@/services/proposals.service";
import * as messagesService from "@/services/messages.service";
import { getErrorMessage } from "@/utils/errors";
import { formatDate, formatTime } from "@/utils/format";
import type { Message } from "@/types/api";

const POLL_INTERVAL = 12000;

interface Conversa {
  serviceRequestId: string;
  titulo: string;
  subtitulo: string;
  status?: string;
}

/**
 * Chat por solicitação (GET/POST /messages/:serviceRequestId). O polling abaixo
 * é substituível por WebSocket sem mudar o restante da tela: basta trocar a
 * função de atualização de `messages`.
 */
export default function Chat() {
  const { serviceRequestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isProvider = user?.role === "PRESTADOR";

  const conversas = useRequest(async (): Promise<Conversa[]> => {
    if (isProvider) {
      const proposals = await proposalsService.listMine();
      const unicos = new Map<string, Conversa>();
      proposals.forEach((proposal) => {
        if (!unicos.has(proposal.serviceRequestId)) {
          unicos.set(proposal.serviceRequestId, {
            serviceRequestId: proposal.serviceRequestId,
            titulo: proposal.serviceRequest?.title ?? "Solicitação",
            subtitulo: proposal.serviceRequest?.city ?? "",
            status: proposal.serviceRequest?.status,
          });
        }
      });
      return [...unicos.values()];
    }
    const requests = await serviceRequestsService.listMine();
    return requests.map((request) => ({
      serviceRequestId: request.id,
      titulo: request.title,
      subtitulo: `${request.category?.name ?? ""} · ${request.city}`,
      status: request.status,
    }));
  }, [isProvider]);

  const lista = conversas.data ?? [];
  const ativa = useMemo(
    () => lista.find((item) => item.serviceRequestId === serviceRequestId) ?? null,
    [lista, serviceRequestId]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
      <Card className={`overflow-hidden ${serviceRequestId ? "hidden lg:block" : ""}`}>
        <div className="border-b border-slate-100 px-4 py-3">
          <h1 className="text-base font-semibold text-ink">Conversas</h1>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {conversas.loading ? (
            <div className="p-4"><SkeletonRows count={4} /></div>
          ) : conversas.missingEndpoint && isProvider ? (
            <div className="p-4">
              <EndpointPendente
                titulo="Lista de conversas indisponível"
                endpoint="GET /api/proposals/mine"
                descricao="A lista de conversas do prestador é montada a partir das propostas enviadas. Abrir uma conversa direto pelo serviço continua funcionando."
                onRetry={conversas.reload}
              />
            </div>
          ) : conversas.error ? (
            <div className="p-4"><ErrorState message={conversas.error} onRetry={conversas.reload} /></div>
          ) : lista.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              Nenhuma conversa ainda. Elas aparecem quando existe uma solicitação com propostas.
            </p>
          ) : (
            <ul>
              {lista.map((conversa) => (
                <li key={conversa.serviceRequestId}>
                  <button
                    type="button"
                    onClick={() => navigate(`/chat/${conversa.serviceRequestId}`)}
                    className={`flex w-full flex-col gap-1 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      conversa.serviceRequestId === serviceRequestId ? "bg-primary-light/50" : ""
                    }`}
                  >
                    <span className="truncate font-medium text-ink">{conversa.titulo}</span>
                    <span className="truncate text-xs text-slate-500">{conversa.subtitulo}</span>
                    {conversa.status ? <StatusBadge status={conversa.status} /> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {serviceRequestId ? (
        <Janela serviceRequestId={serviceRequestId} titulo={ativa?.titulo ?? "Conversa"} />
      ) : (
        <Card className="hidden items-center justify-center p-10 lg:flex">
          <EmptyState
            icon={<MessageSquare className="h-6 w-6" aria-hidden />}
            title="Escolha uma conversa"
            description="Selecione uma solicitação à esquerda para ver as mensagens."
          />
        </Card>
      )}
    </div>
  );
}

function Janela({ serviceRequestId, titulo }: { serviceRequestId: string; titulo: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  async function carregar(silencioso = false) {
    if (!silencioso) setLoading(true);
    try {
      const data = await messagesService.list(serviceRequestId);
      setMessages(data);
      setLoadError(null);
      await messagesService.markAsRead(serviceRequestId).catch(() => undefined);
    } catch (error) {
      if (!silencioso) setLoadError(getErrorMessage(error, "Não foi possível carregar as mensagens."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
    const timer = window.setInterval(() => void carregar(true), POLL_INTERVAL);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceRequestId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function enviar(event: React.FormEvent) {
    event.preventDefault();
    const content = texto.trim();
    if (!content) return;
    setSending(true);
    try {
      const message = await messagesService.send(serviceRequestId, content);
      setMessages((current) => [...current, message]);
      setTexto("");
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível enviar sua mensagem."));
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="flex h-[70vh] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <button type="button" className="rounded-lg p-1 text-slate-500 lg:hidden" onClick={() => navigate("/chat")} aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="truncate font-semibold text-ink">{titulo}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="ml-auto h-12 w-1/2" />
            <Skeleton className="h-12 w-3/5" />
          </div>
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={() => carregar()} />
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Nenhuma mensagem ainda. Escreva a primeira para combinar os detalhes do serviço.
          </p>
        ) : (
          messages.map((message, index) => {
            const mine = message.senderId === user?.id;
            const previous = messages[index - 1];
            const showDate = !previous || formatDate(previous.createdAt) !== formatDate(message.createdAt);
            return (
              <div key={message.id}>
                {showDate ? (
                  <p className="my-3 text-center text-xs font-medium text-slate-400">{formatDate(message.createdAt)}</p>
                ) : null}
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      mine ? "bg-primary text-white" : "bg-white text-ink"
                    }`}
                  >
                    <p className="whitespace-pre-line">{message.content}</p>
                    <p className={`mt-1 text-right text-[11px] ${mine ? "text-white/70" : "text-slate-400"}`}>
                      {formatTime(message.createdAt)}
                      {mine ? (message.readAt ? " · lida" : " · enviada") : ""}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottom} />
      </div>

      <form onSubmit={enviar} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <Input
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          placeholder="Escreva sua mensagem"
          maxLength={2000}
          aria-label="Mensagem"
        />
        <Button type="submit" loading={sending} aria-label="Enviar mensagem" icon={<Send className="h-4 w-4" aria-hidden />}>
          <span className="hidden sm:inline">Enviar</span>
        </Button>
      </form>
    </Card>
  );
}
