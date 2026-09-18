import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, AuthenticatedRequest } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../middlewares/errorHandler";
import { notifyUser } from "../notifications/notifications.service";

const router = Router();

async function assertParticipant(serviceRequestId: string, userId: string) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: serviceRequestId },
    include: { customer: true, proposals: { include: { provider: true } } },
  });
  if (!request) throw new AppError("Solicitação não encontrada.", 404);

  const isCustomer = request.customer.userId === userId;
  const isInvolvedProvider = request.proposals.some((p) => p.provider.userId === userId);
  if (!isCustomer && !isInvolvedProvider) {
    throw new AppError("O chat só é liberado entre cliente e prestadores envolvidos nesta solicitação.", 403);
  }
  return { request, isCustomer };
}

router.get(
  "/:serviceRequestId",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    await assertParticipant(req.params.serviceRequestId, req.user!.id);
    const messages = await prisma.message.findMany({
      where: { serviceRequestId: req.params.serviceRequestId },
      orderBy: { createdAt: "asc" },
    });
    res.json(messages);
  })
);

const sendSchema = z.object({ content: z.string().min(1).max(2000) });

router.post(
  "/:serviceRequestId",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { content } = sendSchema.parse(req.body);
    const { request, isCustomer } = await assertParticipant(req.params.serviceRequestId, req.user!.id);

    const message = await prisma.message.create({
      data: { serviceRequestId: req.params.serviceRequestId, senderId: req.user!.id, content },
    });

    // TODO(tempo real): publicar este evento em um canal (ex: WebSocket/Socket.IO ou
    // Redis pub/sub) para push instantâneo — hoje o outro lado recebe via polling REST.
    if (isCustomer) {
      const acceptedProposal = request.proposals.find((p) => p.status === "ACEITA") ?? request.proposals[0];
      if (acceptedProposal) {
        await notifyUser(acceptedProposal.provider.userId, "NOVA_MENSAGEM", "Nova mensagem", content.slice(0, 100));
      }
    } else {
      await notifyUser(request.customer.userId, "NOVA_MENSAGEM", "Nova mensagem", content.slice(0, 100));
    }

    res.status(201).json(message);
  })
);

router.post(
  "/:serviceRequestId/read",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    await assertParticipant(req.params.serviceRequestId, req.user!.id);
    await prisma.message.updateMany({
      where: { serviceRequestId: req.params.serviceRequestId, senderId: { not: req.user!.id }, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ ok: true });
  })
);

export default router;
