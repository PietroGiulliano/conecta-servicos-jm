import { useState } from "react";
import { BarChart3, Coins, Percent, Receipt, Wallet } from "lucide-react";
import { Button, Card, CardHeader, EmptyState, ErrorState, Field, Input, Select, SkeletonRows } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { useRequest } from "@/hooks/useRequest";
import * as adminService from "@/services/admin.service";
import type { FinancialFilters } from "@/services/admin.service";
import { formatCurrency, formatDateTime } from "@/utils/format";

const statusOptions = ["PENDENTE", "APROVADO", "RECUSADO", "CANCELADO", "ESTORNADO", "CHARGEBACK"];
const methodOptions = [
  { value: "PIX", label: "PIX" },
  { value: "CARTAO_CREDITO", label: "Cartão de crédito" },
];

export default function AdminPagamentos() {
  const [form, setForm] = useState<FinancialFilters>({});
  const [filters, setFilters] = useState<FinancialFilters>({});
  const { data, loading, error, reload } = useRequest(() => adminService.financialReport(filters), [filters]);

  function aplicar() {
    const clean: FinancialFilters = {};
    (Object.keys(form) as (keyof FinancialFilters)[]).forEach((key) => {
      const value = form[key];
      if (value) clean[key] = value;
    });
    setFilters(clean);
  }

  function limpar() {
    setForm({});
    setFilters({});
  }

  const totals = data?.totals;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Pagamentos e comissões</h1>
        <p className="mt-1 text-sm text-slate-500">
          Todos os valores exibidos aqui são calculados e retornados pelo backend.
        </p>
      </div>

      <Card>
        <CardHeader title="Filtros" description="Refine o relatório financeiro por período, status ou método." />
        <div className="grid gap-4 p-5 pt-0 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="De">
            <Input
              type="date"
              value={form.startDate ?? ""}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
            />
          </Field>
          <Field label="Até">
            <Input
              type="date"
              value={form.endDate ?? ""}
              onChange={(event) => setForm({ ...form, endDate: event.target.value })}
            />
          </Field>
          <Field label="Status">
            <Select value={form.status ?? ""} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="">Todos</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Método">
            <Select value={form.method ?? ""} onChange={(event) => setForm({ ...form, method: event.target.value })}>
              <option value="">Todos</option>
              {methodOptions.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="button" onClick={aplicar}>
              Aplicar filtros
            </Button>
            <Button type="button" variant="ghost" onClick={limpar}>
              Limpar
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={<Receipt className="h-5 w-5" />} label="Pagamentos" value={String(data?.count ?? 0)} loading={loading} />
        <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Volume bruto" value={formatCurrency(totals?.grossVolume ?? 0)} loading={loading} />
        <StatCard icon={<Percent className="h-5 w-5" />} label="Comissões" value={formatCurrency(totals?.commissions ?? 0)} loading={loading} />
        <StatCard icon={<Coins className="h-5 w-5" />} label="Taxas do gateway" value={formatCurrency(totals?.fees ?? 0)} loading={loading} />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Líquido aos prestadores" value={formatCurrency(totals?.netAmount ?? 0)} loading={loading} />
      </div>

      <Card>
        <CardHeader title="Transações" description="Registro individual de cada pagamento processado." />
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5">
              <SkeletonRows count={5} />
            </div>
          ) : error ? (
            <div className="p-5">
              <ErrorState message={error} onRetry={reload} />
            </div>
          ) : (data?.payments.length ?? 0) === 0 ? (
            <div className="p-5">
              <EmptyState title="Nenhum pagamento encontrado para os filtros selecionados." />
            </div>
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Serviço</th>
                  <th className="px-5 py-3">Método</th>
                  <th className="px-5 py-3 text-right">Bruto</th>
                  <th className="px-5 py-3 text-right">Comissão</th>
                  <th className="px-5 py-3 text-right">Taxas</th>
                  <th className="px-5 py-3 text-right">Líquido</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.payments ?? []).map((payment) => (
                  <tr key={payment.id} className="align-middle">
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{payment.id.slice(0, 8)}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">
                        {payment.order?.serviceRequest?.title ?? "Pedido " + payment.orderId.slice(0, 8)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {payment.order?.provider?.professionalName ?? "Prestador não informado"}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {payment.method === "CARTAO_CREDITO" ? "Cartão" : payment.method}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(payment.grossAmount)}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(payment.commissionAmount)}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(payment.gatewayFeeAmount)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-ink">
                      {formatCurrency(payment.providerNetAmount)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDateTime(payment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
