import { Router } from "express";
import { prisma } from "../../config/prisma";
import { requireAuth, AuthenticatedRequest } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(notifications);
  })
);

router.post(
  "/:id/read",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { readAt: new Date() },
    });
    res.json({ updated: notification.count });
  })
);

export default router;
