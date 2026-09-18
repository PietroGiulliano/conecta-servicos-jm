import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireAuth, requireRole, AuthenticatedRequest } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../middlewares/errorHandler";

const router = Router();

router.get("/me", requireAuth, requireRole("EMPRESA"), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const company = await prisma.companyProfile.findUnique({
    where: { userId: req.user!.id },
    include: { user: true },
  });
  if (!company) throw new AppError("Perfil da empresa não encontrado.", 404);
  res.json(company);
}));

router.put("/me", requireAuth, requireRole("EMPRESA"), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const input = z.object({
    legalName: z.string().min(2).optional(),
    tradeName: z.string().optional(),
    industry: z.string().optional(),
    website: z.string().url().optional(),
    description: z.string().optional(),
    city: z.string().min(2).optional(),
    state: z.string().min(2).max(2).optional(),
  }).parse(req.body);
  const company = await prisma.companyProfile.update({ where: { userId: req.user!.id }, data: input });
  res.json(company);
}));

router.get("/me/requests", requireAuth, requireRole("EMPRESA"), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user!.id } });
  if (!customer) throw new AppError("Perfil de cliente da empresa não encontrado.", 404);
  const requests = await prisma.serviceRequest.findMany({
    where: { customerId: customer.id },
    include: { category: true, proposals: { include: { provider: { include: { user: true } } } }, order: { include: { payment: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(requests);
}));

export default router;
