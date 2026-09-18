import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens."),
  iconKey: z.string().optional(),
});

// Pública: usada na landing page, busca e cadastro de prestador
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  })
);

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const input = categorySchema.parse(req.body);
    const category = await prisma.category.create({ data: input });
    res.status(201).json(category);
  })
);

router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const input = categorySchema.partial().parse(req.body);
    const category = await prisma.category.update({ where: { id: req.params.id }, data: input });
    res.json(category);
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.category.update({ where: { id: req.params.id }, data: { active: false } });
    res.status(204).send();
  })
);

export default router;
