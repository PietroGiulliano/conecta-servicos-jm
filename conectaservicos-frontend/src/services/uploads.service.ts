import { api } from "@/api/api";

export interface UploadResponse {
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Envia um arquivo (imagem JPG/PNG/WEBP ou PDF, até 5MB) para o backend e
 * devolve a URL pública salva. Use o `url` retornado nos campos que hoje
 * aceitam texto simples (avatar, fotos da solicitação, documentos do
 * prestador) — o backend já os armazena como string.
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<UploadResponse>("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
