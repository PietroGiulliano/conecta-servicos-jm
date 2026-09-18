import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRole, AuthenticatedRequest } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../middlewares/errorHandler";

const router = Router();

router.get(
  "/me",
  requireAuth,
  requireRole("PRESTADOR"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const provider = await prisma.providerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!provider) throw new AppError("Perfil de prestador não encontrado.", 404);

    const wallet = await prisma.providerWallet.findUnique({
      where: { providerId: provider.id },
      include: { payouts: { orderBy: { requestedAt: "desc" }, take: 20 } },
    });
    const completedOrders = await prisma.order.count({
      where: { providerId: provider.id, serviceRequest: { status: "CONCLUIDO" } },
    });

    res.json({ wallet, completedOrders });
  })
);

const payoutSchema = z.object({ amount: z.number().positive() });

// Solicita repasse do saldo disponível. Em produção, isso deve acionar a API de
// transferência do gateway (ex: Mercado Pago Payouts / Stripe Transfers) — aqui
// registramos a solicitação para processamento assíncrono por um worker/admin.
router.post(
  "/me/payout",
  requireAuth,
  requireRole("PRESTADOR"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { amount } = payoutSchema.parse(req.body);
    const provider = await prisma.providerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!provider) throw new AppError("Perfil de prestador não encontrado.", 404);

    const wallet = await prisma.providerWallet.findUnique({ where: { providerId: provider.id } });
    if (!wallet || Number(wallet.availableBalance) < amount) {
      throw new AppError("Saldo disponível insuficiente para este repasse.", 409);
    }

    const payout = await prisma.$transaction(async (tx) => {
      await tx.providerWallet.update({
        where: { id: wallet.id },
        data: { availableBalance: { decrement: amount } },
      });
      return tx.payout.create({
        data: { walletId: wallet.id, amount, status: "PENDENTE" },
      });
    });

    res.status(201).json(payout);
  })
);

export default router;
