import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRole, AuthenticatedRequest } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../middlewares/errorHandler";
import { notifyUser } from "../notifications/notifications.service";
import { getCurrentCommissionPercent } from "../admin/platformSettings.service";

const router = Router();

const createProposalSchema = z.object({
  serviceRequestId: z.string().uuid(),
  value: z.number().positive(),
  description: z.string().min(4),
  estimatedDays: z.number().int().positive().optional(),
  availableDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

router.post(
  "/",
  requireAuth,
  requireRole("PRESTADOR"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = createProposalSchema.parse(req.body);
    const provider = await prisma.providerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!provider) throw new AppError("Perfil de prestador não encontrado.", 404);

    const request = await prisma.serviceRequest.findUnique({ where: { id: input.serviceRequestId } });
    if (!request) throw new AppError("Solicitação não encontrada.", 404);
    if (!["SOLICITADO", "PROPOSTAS_RECEBIDAS"].includes(request.status)) {
      throw new AppError("Esta solicitação não está mais aceitando propostas.", 409);
    }

    const proposal = await prisma.$transaction(async (tx) => {
      const created = await tx.proposal.create({
        data: {
          serviceRequestId: input.serviceRequestId,
          providerId: provider.id,
          value: input.value,
          description: input.description,
          estimatedDays: input.estimatedDays,
          availableDate: input.availableDate ? new Date(input.availableDate) : undefined,
          notes: input.notes,
        },
      });
      await tx.serviceRequest.update({
        where: { id: input.serviceRequestId },
        data: { status: "PROPOSTAS_RECEBIDAS", statusHistory: { create: { status: "PROPOSTAS_RECEBIDAS" } } },
      });
      return created;
    });

    const customer = await prisma.customerProfile.findUnique({
      where: { id: request.customerId },
      include: { user: true },
    });
    if (customer) {
      await notifyUser(
        customer.user.id,
        "NOVA_PROPOSTA",
        "Você recebeu uma nova proposta",
        `${provider.professionalName} enviou uma proposta de R$ ${input.value.toFixed(2)}`
      );
    }

    res.status(201).json(proposal);
  })
);

router.post(
  "/:id/accept",
  requireAuth,
  requireRole("CLIENTE", "EMPRESA"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { serviceRequest: true, provider: { include: { user: true } } },
    });
    if (!proposal) throw new AppError("Proposta não encontrada.", 404);

    const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!customer || proposal.serviceRequest.customerId !== customer.id) {
      throw new AppError("Você não tem permissão para aceitar esta proposta.", 403);
    }
    if (proposal.status !== "ENVIADA") {
      throw new AppError("Esta proposta não está mais disponível.", 409);
    }

    const commissionPercent = await getCurrentCommissionPercent();
    const grossAmount = Number(proposal.value);
    const commissionAmount = round2((grossAmount * commissionPercent) / 100);
    const providerAmount = round2(grossAmount - commissionAmount);

    const order = await prisma.$transaction(async (tx) => {
      await tx.proposal.update({ where: { id: proposal.id }, data: { status: "ACEITA" } });
      await tx.proposal.updateMany({
        where: { serviceRequestId: proposal.serviceRequestId, id: { not: proposal.id }, status: "ENVIADA" },
        data: { status: "RECUSADA" },
      });
      await tx.serviceRequest.update({
        where: { id: proposal.serviceRequestId },
        data: {
          status: "AGUARDANDO_PAGAMENTO",
          statusHistory: { create: { status: "AGUARDANDO_PAGAMENTO" } },
        },
      });
      return tx.order.create({
        data: {
          serviceRequestId: proposal.serviceRequestId,
          proposalId: proposal.id,
          customerId: customer.id,
          providerId: proposal.providerId,
          grossAmount,
          commissionRate: commissionPercent,
          commissionAmount,
          providerAmount,
        },
      });
    });

    await notifyUser(
      proposal.provider.user.id,
      "PROPOSTA_ACEITA",
      "Sua proposta foi aceita!",
      "O cliente aceitou sua proposta. Aguardando pagamento para iniciar o serviço."
    );

    res.status(201).json(order);
  })
);

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default router;
