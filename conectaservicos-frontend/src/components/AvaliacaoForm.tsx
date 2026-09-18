import { useState } from "react";
import { Star } from "lucide-react";
import { Button, Card, Textarea } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import * as reviewsService from "@/services/reviews.service";
import { getErrorMessage } from "@/utils/errors";

/** Avaliação do serviço concluído. A duplicidade também é barrada pelo backend. */
export function AvaliacaoForm({ orderId, onDone }: { orderId: string; onDone: () => void }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (rating < 1) {
      toast.error("Escolha de 1 a 5 estrelas para avaliar.");
      return;
    }
    setSaving(true);
    try {
      await reviewsService.create({ orderId, rating, comment: comment.trim() || undefined });
      setSent(true);
      toast.success("Avaliação enviada. Obrigado!");
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível enviar sua avaliação."));
    } finally {
      setSaving(false);
    }
  }

  if (sent) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-slate-600">Sua avaliação já aparece no perfil do profissional.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-ink">Como foi o serviço?</h2>
      <p className="mt-1 text-sm text-slate-500">Sua nota ajuda outros clientes a escolherem bem.</p>

      <div className="mt-4 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
            className="rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Star
              className={`h-8 w-8 transition ${
                star <= (hover || rating) ? "fill-warning text-warning" : "text-slate-300"
              }`}
              aria-hidden
            />
          </button>
        ))}
      </div>

      <Textarea
        className="mt-4"
        placeholder="Conte como foi sua experiência."
        maxLength={1000}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />

      <Button className="mt-4" loading={saving} onClick={submit}>
        Enviar avaliação
      </Button>
    </Card>
  );
}
