import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRole, AuthenticatedRequest } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../middlewares/errorHandler";
import { getCurrentCommissionPercent, setCommissionPercent } from "./platformSettings.service";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

// ── Usuários ─────────────────────────────────────────────────
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { role, status, page = "1", pageSize = "20" } = req.query as Record<string, string>;
    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ data: users, pagination: { page: Number(page), pageSize: Number(pageSize), total } });
  })
);

router.post(
  "/users/:id/block",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { status: "BLOQUEADO" } });
    res.json(user);
  })
);

router.post(
  "/users/:id/unblock",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { status: "ATIVO" } });
    res.json(user);
  })
);

// ── Aprovação de prestadores e documentos ───────────────────
router.get(
  "/providers/pending",
  asyncHandler(async (_req, res) => {
    const providers = await prisma.providerProfile.findMany({
      where: { approvalStatus: "PENDENTE" },
      include: { user: true, documents: true, category: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(providers);
  })
);

router.post(
  "/providers/:id/approve",
  asyncHandler(async (req, res) => {
    const provider = await prisma.providerProfile.update({
      where: { id: req.params.id },
      data: { approvalStatus: "APROVADO", user: { update: { status: "ATIVO" } } },
    });
    res.json(provider);
  })
);

router.post(
  "/providers/:id/reject",
  asyncHandler(async (req, res) => {
    const provider = await prisma.providerProfile.update({
      where: { id: req.params.id },
      data: { approvalStatus: "REPROVADO" },
    });
    res.json(provider);
  })
);

router.post(
  "/providers/documents/:id/verify",
  asyncHandler(async (req, res) => {
    const document = await prisma.providerDocument.update({
      where: { id: req.params.id },
      data: { verified: true, verifiedAt: new Date() },
    });
    res.json(document);
  })
);

// ── Comissão ─────────────────────────────────────────────────
router.get(
  "/settings/commission",
  asyncHandler(async (_req, res) => {
    res.json({ percent: await getCurrentCommissionPercent() });
  })
);

router.put(
  "/settings/commission",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { percent } = z.object({ percent: z.number().min(0).max(100) }).parse(req.body);
    const updated = await setCommissionPercent(percent);
    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: "UPDATE_COMMISSION", entity: "PlatformSetting", metadata: { percent } },
    });
    res.json({ percent: updated });
  })
);

// ── Dashboard ────────────────────────────────────────────────
router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const [totalUsers, totalCustomers, totalCompanies, totalProviders, servicesInProgress, servicesCompleted, cancellations] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: { in: ["CLIENTE", "EMPRESA"] } } }),
        prisma.user.count({ where: { role: "EMPRESA" } }),
        prisma.user.count({ where: { role: "PRESTADOR" } }),
        prisma.serviceRequest.count({ where: { status: "EM_ANDAMENTO" } }),
        prisma.serviceRequest.count({ where: { status: "CONCLUIDO" } }),
        prisma.serviceRequest.count({ where: { status: { in: ["CANCELADO", "ESTORNADO"] } } }),
      ]);

    const financials = await prisma.payment.aggregate({
      where: { status: "APROVADO" },
      _sum: { grossAmount: true, commissionAmount: true, providerNetAmount: true },
      _count: true,
    });

    res.json({
      totalUsers,
      totalCustomers,
      totalCompanies,
      totalProviders,
      servicesInProgress,
      servicesCompleted,
      cancellations,
      grossVolume: financials._sum.grossAmount ?? 0,
      totalCommission: financials._sum.commissionAmount ?? 0,
      totalProviderPayout: financials._sum.providerNetAmount ?? 0,
      approvedPaymentsCount: financials._count,
    });
  })
);

router.get(
  "/dashboard/growth",
  asyncHandler(async (_req, res) => {
    // Séries mensais simples para os gráficos de faturamento/serviços/comissão/novos usuários
    const payments = await prisma.$queryRawUnsafe<any[]>(`
      SELECT to_char("createdAt", 'YYYY-MM') as month,
             SUM("grossAmount")::float as gross,
             SUM("commissionAmount")::float as commission,
             COUNT(*)::int as count
      FROM payments
      WHERE status = 'APROVADO'
      GROUP BY month
      ORDER BY month ASC
    `);
    const users = await prisma.$queryRawUnsafe<any[]>(`
      SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*)::int as count
      FROM users
      GROUP BY month
      ORDER BY month ASC
    `);
    res.json({ payments, users });
  })
);

// ── Relatório financeiro com filtros ────────────────────────
router.get(
  "/reports/financial",
  asyncHandler(async (req, res) => {
    const { startDate, endDate, providerId, categoryId, status, method } = req.query as Record<string, string>;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (status) where.status = status;
    if (method) where.method = method;
    if (providerId) where.order = { providerId };
    if (categoryId) where.order = { ...where.order, serviceRequest: { categoryId } };

    const payments = await prisma.payment.findMany({
      where,
      include: { order: { include: { serviceRequest: true, provider: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const totals = payments.reduce(
      (acc, p) => {
        acc.grossVolume += Number(p.grossAmount);
        acc.commissions += Number(p.commissionAmount);
        acc.fees += Number(p.gatewayFeeAmount ?? 0);
        if (p.status === "ESTORNADO") acc.refunds += Number(p.grossAmount);
        acc.netAmount += Number(p.providerNetAmount);
        return acc;
      },
      { grossVolume: 0, commissions: 0, fees: 0, refunds: 0, netAmount: 0 }
    );

    res.json({ count: payments.length, totals, payments });
  })
);

// ── Denúncias / Disputas ─────────────────────────────────────
router.get(
  "/disputes",
  asyncHandler(async (_req, res) => {
    const disputes = await prisma.dispute.findMany({ orderBy: { createdAt: "desc" } });
    res.json(disputes);
  })
);

router.post(
  "/disputes/:id/resolve",
  asyncHandler(async (req, res) => {
    const { resolution, status } = z
      .object({ resolution: z.string().min(2), status: z.enum(["RESOLVIDA", "REJEITADA"]) })
      .parse(req.body);
    const dispute = await prisma.dispute.update({
      where: { id: req.params.id },
      data: { resolution, status, resolvedAt: new Date() },
    });
    res.json(dispute);
  })
);

export default router;
