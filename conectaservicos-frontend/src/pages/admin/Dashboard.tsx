import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, CreditCard, Percent, Users, Wrench } from "lucide-react";
import { Card, CardHeader, ErrorState, Select, Skeleton } from "@/components/ui";
import { StatCard } from "@/components/StatCard";
import { useRequest } from "@/hooks/useRequest";
import * as adminService from "@/services/admin.service";
import { formatCurrency } from "@/utils/format";

const periodos = [
  { value: "6", label: "Últimos 6 meses" },
  { value: "12", label: "Últimos 12 meses" },
  { value: "0", label: "Todo o período" },
];

export default function AdminDashboard() {
  const dashboard = useRequest(() => adminService.dashboard(), []);
  const growth = useRequest(() => adminService.growth(), []);
  const [periodo, setPeriodo] = useState("6");

  const series = useMemo(() => {
    const payments = growth.data?.payments ?? [];
    const users = growth.data?.users ?? [];
    const meses = Number(periodo);
    const recorte = <T,>(list: T[]) => (meses > 0 ? list.slice(-meses) : list);
    return {
      financeiro: recorte(payments).map((item) => ({
        mes: item.month,
        faturamento: item.gross,
        comissao: item.commission,
        servicos: item.count,
      })),
      usuarios: recorte(users).map((item) => ({ mes: item.month, novos: item.count })),
    };
  }, [growth.data, periodo]);

  const data = dashboard.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Visão geral</h1>
          <p className="mt-1 text-sm text-slate-500">Operação, volume financeiro e comissão gerada.</p>
        </div>
        <div className="w-48">
          <Select value={periodo} onChange={(event) => setPeriodo(event.target.value)} aria-label="Período">
            {periodos.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {dashboard.error ? (
        <ErrorState message={dashboard.error} onRetry={dashboard.reload} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Usuários" value={data?.totalUsers ?? 0} icon={<Users className="h-5 w-5" aria-hidden />} loading={dashboard.loading} />
          <StatCard label="Prestadores" value={data?.totalProviders ?? 0} icon={<Wrench className="h-5 w-5" aria-hidden />} loading={dashboard.loading} />
          <StatCard label="Empresas" value={data?.totalCompanies ?? 0} icon={<Building2 className="h-5 w-5" aria-hidden />} loading={dashboard.loading} />
          <StatCard label="Serviços concluídos" value={data?.servicesCompleted ?? 0} hint={`${data?.servicesInProgress ?? 0} em andamento`} loading={dashboard.loading} />
          <StatCard label="Volume financeiro" value={formatCurrency(data?.grossVolume ?? 0)} icon={<CreditCard className="h-5 w-5" aria-hidden />} loading={dashboard.loading} />
          <StatCard label="Comissão gerada" value={formatCurrency(data?.totalCommission ?? 0)} icon={<Percent className="h-5 w-5" aria-hidden />} loading={dashboard.loading} />
          <StatCard label="Repassado a prestadores" value={formatCurrency(data?.totalProviderPayout ?? 0)} loading={dashboard.loading} />
          <StatCard label="Pagamentos aprovados" value={data?.approvedPaymentsCount ?? 0} hint={`${data?.cancellations ?? 0} cancelamentos`} loading={dashboard.loading} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Faturamento e comissão" description="Pagamentos aprovados por mês" />
          <div className="h-72 p-5">
            {growth.loading ? (
              <Skeleton className="h-full w-full" />
            ) : growth.error ? (
              <ErrorState message={growth.error} onRetry={growth.reload} />
            ) : series.financeiro.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-slate-500">Ainda não há pagamentos aprovados.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series.financeiro}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="faturamento" name="Faturamento" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="comissao" name="Comissão" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Novos usuários" description="Cadastros por mês" />
          <div className="h-72 p-5">
            {growth.loading ? (
              <Skeleton className="h-full w-full" />
            ) : series.usuarios.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-slate-500">Sem dados no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series.usuarios}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="novos" name="Novos usuários" stroke="#16A34A" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
