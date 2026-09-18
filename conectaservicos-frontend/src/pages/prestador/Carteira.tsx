import { useState } from "react";
import { Wallet } from "lucide-react";
import { Button, Card, CardHeader, EmptyState, ErrorState, Field, Input, SkeletonRows } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useRequest } from "@/hooks/useRequest";
import { useToast } from "@/contexts/ToastContext";
import * as walletService from "@/services/wallet.service";
import { getErrorMessage } from "@/utils/errors";
import { formatCurrency, formatDate, toNumber } from "@/utils/format";

export default function Carteira() {
  const toast = useToast();
  const { data, loading, error, reload } = useRequest(() => walletService.getMine(), []);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const wallet = data?.wallet;
  const available = toNumber(wallet?.availableBalance);

  async function solicitar() {
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    setSaving(true);
    try {
      await walletService.requestPayout(value);
      toast.success("Repasse solicitado. O valor sai do saldo disponível e entra na fila de processamento.");
      setOpen(false);
      setAmount("");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível solicitar o repasse."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Carteira</h1>
          <p className="mt-1 text-sm text-slate-500">Saldos e histórico de repasses, conforme registrado pelo servidor.</p>
        </div>
        <Button disabled={available <= 0} onClick={() => setOpen(true)}>
          Solicitar repasse
        </Button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Saldo disponível" value={formatCurrency(wallet?.availableBalance ?? 0)} loading={loading} icon={<Wallet className="h-5 w-5" aria-hidden />} />
            <StatCard label="Saldo pendente" value={formatCurrency(wallet?.pendingBalance ?? 0)} hint="Liberado após a conclusão do serviço" loading={loading} />
            <StatCard label="Total bruto recebido" value={formatCurrency(wallet?.totalReceived ?? 0)} loading={loading} />
            <StatCard label="Comissões descontadas" value={formatCurrency(wallet?.totalCommission ?? 0)} loading={loading} />
            <StatCard label="Taxas do gateway" value={formatCurrency(wallet?.totalFees ?? 0)} loading={loading} />
            <StatCard label="Serviços concluídos" value={data?.completedOrders ?? 0} loading={loading} />
          </div>

          <Card>
            <CardHeader title="Histórico de repasses" description="Últimos 20 repasses solicitados" />
            <div className="p-5">
              {loading ? (
                <SkeletonRows count={3} />
              ) : (wallet?.payouts?.length ?? 0) === 0 ? (
                <EmptyState
                  title="Nenhum repasse solicitado ainda."
                  description="Quando o cliente confirma a conclusão, o valor vai para o saldo disponível e você pode solicitar o repasse."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {(wallet?.payouts ?? []).map((payout) => (
                    <li key={payout.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-medium text-ink">{formatCurrency(payout.amount)}</p>
                        <p className="text-sm text-slate-500">
                          Solicitado em {formatDate(payout.requestedAt)}
                          {payout.paidAt ? ` · pago em ${formatDate(payout.paidAt)}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={payout.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Solicitar repasse"
        description={`Saldo disponível: ${formatCurrency(available)}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Voltar</Button>
            <Button loading={saving} onClick={solicitar}>Solicitar</Button>
          </>
        }
      >
        <Field label="Valor do repasse (R$)" required>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0,00"
          />
        </Field>
      </Modal>
    </div>
  );
}
