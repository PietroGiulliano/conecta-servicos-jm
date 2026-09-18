import { prisma } from "../../config/prisma";
import type { NotificationType } from "@prisma/client";

// Hoje persiste apenas no banco (consumido via polling/REST pelo frontend).
// Arquitetura pronta para, no futuro, publicar em uma fila (ex: BullMQ) e
// disparar para Email/WhatsApp/Push a partir de workers dedicados, sem
// alterar quem chama `notifyUser`.
export async function notifyUser(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  return prisma.notification.create({
    data: { userId, type, title, body, data: data as any },
  });
}
