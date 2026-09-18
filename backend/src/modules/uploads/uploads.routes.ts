import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { upload } from "./uploads.config";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./uploads.controller";

const router = Router();

// Requer usuário autenticado — evita que qualquer visitante anônimo encha o disco/bucket.
// Aceita um único arquivo no campo "file" (multipart/form-data).
router.post("/", requireAuth, upload.single("file"), asyncHandler(controller.uploadFile));

export default router;
