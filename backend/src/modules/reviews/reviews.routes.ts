import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRole, AuthenticatedRequest } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../middlewares/errorHandler";
import { notifyUser } from "../notifications/notifications.service";

const router = Router();

const createReviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

router.post(
  "/",
  requireAuth,
  requireRole("CLIENTE"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = createReviewSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { customer: true, serviceRequest: true, provider: { include: { user: true } }, review: true },
    });
    if (!order) throw new AppError("Pedido não encontrado.", 404);
    if (order.customer.userId !== req.user!.id) throw new AppError("Sem permissão.", 403);
    if (order.serviceRequest.status !== "CONCLUIDO") {
      throw new AppError("Só é possível avaliar após a conclusão do serviço.", 409);
    }
    if (order.review) {
      throw new AppError("Este pedido já foi avaliado.", 409); // impede avaliação duplicada
    }

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          orderId: order.id,
          customerId: order.customerId,
          providerId: order.providerId,
          rating: input.rating,
          comment: input.comment,
        },
      });

      const stats = await tx.review.aggregate({
        where: { providerId: order.providerId },
        _avg: { rating: true },
        _count: true,
      });
      await tx.providerProfile.update({
        where: { id: order.providerId },
        data: {
          ratingAverage: stats._avg.rating ?? input.rating,
          ratingCount: stats._count,
        },
      });

      return created;
    });

    await notifyUser(
      order.provider.user.id,
      "NOVA_AVALIACAO",
      "Você recebeu uma nova avaliação",
      `Nota: ${input.rating} estrelas`
    );

    res.status(201).json(review);
  })
);

export default router;
