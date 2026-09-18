import { Router } from "express";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRole, AuthenticatedRequest } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../middlewares/errorHandler";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole("CLIENTE"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!customer) throw new AppError("Perfil de cliente não encontrado.", 404);
    const favorites = await prisma.favorite.findMany({
      where: { customerId: customer.id },
      include: { provider: { include: { category: true } } },
    });
    res.json(favorites);
  })
);

router.post(
  "/:providerId",
  requireAuth,
  requireRole("CLIENTE"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!customer) throw new AppError("Perfil de cliente não encontrado.", 404);
    const favorite = await prisma.favorite.upsert({
      where: { customerId_providerId: { customerId: customer.id, providerId: req.params.providerId } },
      create: { customerId: customer.id, providerId: req.params.providerId },
      update: {},
    });
    res.status(201).json(favorite);
  })
);

router.delete(
  "/:providerId",
  requireAuth,
  requireRole("CLIENTE"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!customer) throw new AppError("Perfil de cliente não encontrado.", 404);
    await prisma.favorite.deleteMany({ where: { customerId: customer.id, providerId: req.params.providerId } });
    res.status(204).send();
  })
);

export default router;
