import { Router } from "express";
import express from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRole, AuthenticatedRequest } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../middlewares/errorHandler";
import { webhookLimiter } from "../../middlewares/rateLimit";
import * as paymentsService from "./payments.service";

const router = Router();

const checkoutSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(["PIX", "CARTAO_CREDITO"]),
});

// POST /payments/checkout
router.post(
  "/checkout",
  requireAuth,
  requireRole("CLIENTE", "EMPRESA"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = checkoutSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    const result = await paymentsService.createCheckout(input.orderId, input.method, user!.email);
    res.status(201).json(result);
  })
);

// POST /payments/webhook — IMPORTANTE: precisa do corpo bruto (raw) para validar a
// assinatura do gateway. Por isso usa express.raw() em vez do json() global.
router.post(
  "/webhook",
  webhookLimiter,
  express.raw({ type: "*/*" }),
  asyncHandler(async (req, res) => {
    const result = await paymentsService.handleWebhook(
      req.headers as Record<string, string | string[] | undefined>,
      req.body as Buffer
    );
    res.status(200).json(result);
  })
);

// GET /payments/:id
router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { order: true, transactions: { orderBy: { processedAt: "desc" } } },
    });
    if (!payment) throw new AppError("Pagamento não encontrado.", 404);
    res.json(payment);
  })
);

// POST /payments/:id/refund
router.post(
  "/:id/refund",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const schema = z.object({ reason: z.string().min(4) });
    const { reason } = schema.parse(req.body);
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) throw new AppError("Pagamento não encontrado.", 404);
    const result = await paymentsService.refundOrder(payment.orderId, reason);
    res.json(result);
  })
);

export default router;
