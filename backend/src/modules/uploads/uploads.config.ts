import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuid } from "uuid";
import { env } from "../../config/env";
import { AppError } from "../../middlewares/errorHandler";

// Diretório final onde os arquivos ficam salvos (resolve caminho relativo do .env)
export const uploadsAbsoluteDir = path.resolve(process.cwd(), env.uploadDir);

// Garante que a pasta existe antes do multer tentar escrever nela
fs.mkdirSync(uploadsAbsoluteDir, { recursive: true });

// Tipos aceitos: imagens (avatar, fotos de solicitação/galeria) e PDF (documentos do prestador)
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsAbsoluteDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new AppError("Tipo de arquivo não suportado. Use JPG, PNG, WEBP ou PDF.", 422));
      return;
    }
    cb(null, true);
  },
});
