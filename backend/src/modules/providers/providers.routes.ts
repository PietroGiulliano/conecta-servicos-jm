import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRole, AuthenticatedRequest } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../middlewares/errorHandler";

const router = Router();

// ── Busca pública de prestadores ────────────────────────────────
const searchSchema = z.object({
  categorySlug: z.string().optional(),
  city: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(12),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = searchSchema.parse(req.query);

    const where: any = {
      approvalStatus: "APROVADO",
      user: { status: "ATIVO" },
    };
    if (query.categorySlug) where.category = { slug: query.categorySlug };
    if (query.city) where.citiesServed = { has: query.city };
    if (query.minRating) where.ratingAverage = { gte: query.minRating };
    if (query.maxPrice) where.startingPrice = { lte: query.maxPrice };

    const [providers, total] = await Promise.all([
      prisma.providerProfile.findMany({
        where,
        include: { category: true },
        orderBy: [{ ratingAverage: "desc" }, { ratingCount: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.providerProfile.count({ where }),
    ]);

    res.json({
      data: providers.map(publicProviderCard),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const provider = await prisma.providerProfile.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        galleryItems: true,
        reviewsReceived: {
          include: { customer: { include: { user: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
    if (!provider || provider.approvalStatus !== "APROVADO") {
      throw new AppError("Prestador não encontrado.", 404);
    }
    res.json(publicProviderProfile(provider));
  })
);

// ── Gestão do próprio perfil (prestador autenticado) ────────────
const updateProfileSchema = z.object({
  professionalName: z.string().min(2).optional(),
  bio: z.string().min(10).optional(),
  specialties: z.array(z.string()).optional(),
  citiesServed: z.array(z.string()).optional(),
  serviceRadiusKm: z.number().int().positive().optional(),
  startingPrice: z.number().nonnegative().optional(),
  availability: z.record(z.any()).optional(),
  photoUrl: z.string().url().optional(),
});

router.get(
  "/me/profile",
  requireAuth,
  requireRole("PRESTADOR"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: req.user!.id },
      include: { category: true, documents: true, wallet: true },
    });
    res.json(profile);
  })
);

router.put(
  "/me/profile",
  requireAuth,
  requireRole("PRESTADOR"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = updateProfileSchema.parse(req.body);
    const profile = await prisma.providerProfile.update({
      where: { userId: req.user!.id },
      data: input,
    });
    res.json(profile);
  })
);

router.post(
  "/me/documents",
  requireAuth,
  requireRole("PRESTADOR"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const schema = z.object({ type: z.string(), fileUrl: z.string().url() });
    const input = schema.parse(req.body);
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) throw new AppError("Perfil de prestador não encontrado.", 404);
    const document = await prisma.providerDocument.create({
      data: { providerId: profile.id, type: input.type, fileUrl: input.fileUrl },
    });
    res.status(201).json(document);
  })
);

function publicProviderCard(p: any) {
  return {
    id: p.id,
    professionalName: p.professionalName,
    photoUrl: p.photoUrl,
    category: p.category?.name,
    ratingAverage: p.ratingAverage,
    ratingCount: p.ratingCount,
    citiesServed: p.citiesServed,
    bio: p.bio?.slice(0, 140),
    startingPrice: p.startingPrice,
  };
}

function publicProviderProfile(p: any) {
  return {
    id: p.id,
    professionalName: p.professionalName,
    photoUrl: p.photoUrl,
    category: p.category?.name,
    ratingAverage: p.ratingAverage,
    ratingCount: p.ratingCount,
    citiesServed: p.citiesServed,
    bio: p.bio,
    startingPrice: p.startingPrice,
    availability: p.availability,
    gallery: p.galleryItems,
    reviews: p.reviewsReceived.map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      customerName: r.customer?.user?.name,
    })),
  };
}

export default router;
