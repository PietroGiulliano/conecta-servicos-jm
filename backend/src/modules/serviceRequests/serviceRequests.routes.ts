import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRole, AuthenticatedRequest } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../middlewares/errorHandler";
import { notifyUser } from "../notifications/notifications.service";

const router = Router();

const createSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(4),
  description: z.string().min(10),
  photos: z.array(z.string().url()).default([]),
  addressId: z.string().uuid().optional(),
  city: z.string().min(2),
  desiredDate: z.string().datetime().optional(),
  desiredTime: z.string().optional(),
  approxBudget: z.number().nonnegative().optional(),
  targetProviderId: z.string().uuid().optional(), // solicitação direta a um prestador específico
});

// Cliente cria uma solicitação
router.post(
  "/",
  requireAuth,
  requireRole("CLIENTE", "EMPRESA"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = createSchema.parse(req.body);
    const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!customer) throw new AppError("Perfil de cliente não encontrado.", 404);

    const request = await prisma.serviceRequest.create({
      data: {
        customerId: customer.id,
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        photos: input.photos,
        addressId: input.addressId,
        city: input.city,
        desiredDate: input.desiredDate ? new Date(input.desiredDate) : undefined,
        desiredTime: input.desiredTime,
        approxBudget: input.approxBudget,
        targetProviderId: input.targetProviderId,
        statusHistory: { create: { status: "SOLICITADO" } },
      },
    });

    // Notifica prestadores compatíveis (mesma categoria e cidade, ou o prestador alvo)
    const matchingProviders = await prisma.providerProfile.findMany({
      where: input.targetProviderId
        ? { id: input.targetProviderId }
        : { categoryId: input.categoryId, citiesServed: { has: input.city }, approvalStatus: "APROVADO" },
      select: { userId: true },
    });
    await Promise.all(
      matchingProviders.map((p) =>
        notifyUser(p.userId, "NOVA_SOLICITACAO", "Nova solicitação de serviço", input.title)
      )
    );

    res.status(201).json(request);
  })
);

// Cliente lista suas próprias solicitações
router.get(
  "/mine",
  requireAuth,
  requireRole("CLIENTE", "EMPRESA"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!customer) throw new AppError("Perfil de cliente não encontrado.", 404);
    const requests = await prisma.serviceRequest.findMany({
      where: { customerId: customer.id },
      include: { category: true, proposals: true, order: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  })
);

// Prestador lista solicitações compatíveis com seu perfil (para enviar propostas)
router.get(
  "/available",
  requireAuth,
  requireRole("PRESTADOR"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const provider = await prisma.providerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!provider) throw new AppError("Perfil de prestador não encontrado.", 404);

    const requests = await prisma.serviceRequest.findMany({
      where: {
        status: { in: ["SOLICITADO", "PROPOSTAS_RECEBIDAS"] },
        OR: [
          { targetProviderId: provider.id },
          { targetProviderId: null, categoryId: provider.categoryId ?? undefined, city: { in: provider.citiesServed } },
        ],
        proposals: { none: { providerId: provider.id } },
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  })
);

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        address: true,
        proposals: { include: { provider: true } },
        order: { include: { payment: true } },
        statusHistory: { orderBy: { createdAt: "asc" } },
        customer: { include: { user: true } },
      },
    });
    if (!request) throw new AppError("Solicitação não encontrada.", 404);
    const isOwner = request.customer.userId === req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";
    const isProviderWithProposal = req.user!.role === "PRESTADOR" && request.proposals.some((p) => p.provider.userId === req.user!.id);
    if (!isOwner && !isAdmin && !isProviderWithProposal) throw new AppError("Sem permissão.", 403);
    res.json(request);
  })
);

router.post(
  "/:id/cancel",
  requireAuth,
  requireRole("CLIENTE", "EMPRESA"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const request = await prisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    if (!request) throw new AppError("Solicitação não encontrada.", 404);
    if (["CONCLUIDO", "CANCELADO", "ESTORNADO"].includes(request.status)) {
      throw new AppError("Esta solicitação não pode mais ser cancelada.", 409);
    }
    // Regra: só permite cancelamento direto antes do pagamento aprovado; depois disso,
    // exige fluxo de estorno (ver módulo de pagamentos)
    if (["PAGAMENTO_APROVADO", "EM_ANDAMENTO"].includes(request.status)) {
      throw new AppError(
        "O pagamento já foi aprovado. Solicite o cancelamento pelo suporte para abrir um estorno.",
        409
      );
    }
    const updated = await prisma.serviceRequest.update({
      where: { id: request.id },
      data: { status: "CANCELADO", statusHistory: { create: { status: "CANCELADO" } } },
    });
    res.json(updated);
  })
);

export default router;
