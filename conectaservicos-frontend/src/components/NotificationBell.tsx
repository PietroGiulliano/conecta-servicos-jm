import { useEffect, useRef, useState } from "react";
import { Bell, MessageSquare, Star, Wallet, FileText, CheckCircle2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDateTime } from "@/utils/format";
import type { NotificationType } from "@/types/api";

const icons: Record<NotificationType, typeof Bell> = {
  NOVA_SOLICITACAO: FileText,
  NOVA_PROPOSTA: FileText,
  PROPOSTA_ACEITA: CheckCircle2,
  PAGAMENTO_APROVADO: Wallet,
  PAGAMENTO_PENDENTE: Wallet,
  SERVICO_INICIADO: CheckCircle2,
  SERVICO_CONCLUIDO: CheckCircle2,
  NOVA_MENSAGEM: MessageSquare,
  NOVA_AVALIACAO: Star,
  REPASSE_REALIZADO: Wallet,
};

export function NotificationBell({ enabled }: { enabled: boolean }) {
  const { items, unreadCount, markAsRead, loading } = useNotifications(enabled);
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={container}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unreadCount > 0 ? `Notificações, ${unreadCount} não lidas` : "Notificações"}
        aria-expanded={open}
        className="relative rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-fade-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notificações</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">Carregando notificações...</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">Nada por aqui ainda.</p>
            ) : (
              items.map((item) => {
                const Icon = icons[item.type] ?? Bell;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => !item.readAt && markAsRead(item.id)}
                    className={`flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      item.readAt ? "" : "bg-primary-light/40"
                    }`}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">{item.title}</span>
                      <span className="mt-0.5 block text-sm text-slate-600">{item.body}</span>
                      <span className="mt-1 block text-xs text-slate-400">{formatDateTime(item.createdAt)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
