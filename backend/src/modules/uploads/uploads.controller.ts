import { Response } from "express";
import { env } from "../../config/env";
import { AppError } from "../../middlewares/errorHandler";
import { AuthenticatedRequest } from "../../middlewares/auth";

export async function uploadFile(req: AuthenticatedRequest, res: Response) {
  const file = req.file;
  if (!file) {
    throw new AppError("Nenhum arquivo enviado. Envie um campo 'file' no multipart/form-data.", 422);
  }

  const url = `${env.publicApiUrl}/uploads/${file.filename}`;

  res.status(201).json({
    url,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
  });
}
