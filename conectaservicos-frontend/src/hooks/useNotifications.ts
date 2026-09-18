import { useCallback, useEffect, useState } from "react";
import * as notificationsService from "@/services/notifications.service";
import type { Notification } from "@/types/api";

const POLL_INTERVAL = 45000;

/** Notificações do usuário logado, atualizadas por polling leve. */
export function useNotifications(enabled: boolean) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(enabled);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      setItems(await notificationsService.list());
    } catch {
      // silencioso: o sino não deve quebrar a navegação
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      return;
    }
    void load();
    const timer = window.setInterval(load, POLL_INTERVAL);
    return () => window.clearInterval(timer);
  }, [enabled, load]);

  const markAsRead = useCallback(async (id: string) => {
    setItems((current) => current.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    try {
      await notificationsService.markAsRead(id);
    } catch {
      // mantém o estado otimista; o próximo poll corrige
    }
  }, []);

  return { items, loading, unreadCount: items.filter((n) => !n.readAt).length, reload: load, markAsRead };
}
