import { Router } from "express";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRole, AuthenticatedRequest } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../middlewares/errorHandler";
import { releaseProviderFunds } from "../payments/payments.service";
import { notifyUser } from "../notifications/notifications.service";

const router = Router();

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { payment: true, serviceRequest: true, provider: true, customer: true, review: true },
    });
    if (!order) throw new AppError("Pedido não encontrado.", 404);
    res.json(order);
  })
);

// Prestador marca o serviço como iniciado
router.post(
  "/:id/start",
  requireAuth,
  requireRole("PRESTADOR"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { provider: true } });
    if (!order) throw new AppError("Pedido não encontrado.", 404);
    if (order.provider.userId !== req.user!.id) throw new AppError("Sem permissão.", 403);
    const current = await prisma.serviceRequest.findUnique({ where: { id: order.serviceRequestId } });
    if (!current || current.status !== "PAGAMENTO_APROVADO") {
      throw new AppError("O serviço só pode ser iniciado após a confirmação do pagamento.", 409);
    }

    const request = await prisma.serviceRequest.update({
      where: { id: order.serviceRequestId },
      data: { status: "EM_ANDAMENTO", statusHistory: { create: { status: "EM_ANDAMENTO" } } },
    });
    res.json(request);
  })
);

// Cliente confirma a conclusão do serviço → libera saldo do prestador
router.post(
  "/:id/complete",
  requireAuth,
  requireRole("CLIENTE", "EMPRESA"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { customer: true, provider: { include: { user: true } } },
    });
    if (!order) throw new AppError("Pedido não encontrado.", 404);
    if (order.customer.userId !== req.user!.id) throw new AppError("Sem permissão.", 403);
    const current = await prisma.serviceRequest.findUnique({ where: { id: order.serviceRequestId } });
    if (!current) throw new AppError("Solicitação não encontrada.", 404);
    if (current.status === "CONCLUIDO") throw new AppError("Este serviço já foi concluído.", 409);
    if (current.status !== "EM_ANDAMENTO") throw new AppError("O serviço precisa estar em andamento para ser concluído.", 409);

    await prisma.serviceRequest.update({
      where: { id: order.serviceRequestId },
      data: { status: "CONCLUIDO", statusHistory: { create: { status: "CONCLUIDO" } } },
    });
    await releaseProviderFunds(order.id);
    await notifyUser(
      order.provider.user.id,
      "SERVICO_CONCLUIDO",
      "Serviço concluído",
      "O cliente confirmou a conclusão. O valor foi liberado para seu saldo disponível."
    );
    res.json({ ok: true });
  })
);

export default router;
