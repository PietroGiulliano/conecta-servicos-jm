import type {
  PaymentStatus,
  PayoutStatus,
  ProposalStatus,
  ProviderApprovalStatus,
  ServiceRequestStatus,
  UserStatus,
} from "@/types/api";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const requestLabels: Record<ServiceRequestStatus, { label: string; tone: Tone }> = {
  SOLICITADO: { label: "Aberta", tone: "info" },
  PROPOSTAS_RECEBIDAS: { label: "Com propostas", tone: "info" },
  PROPOSTA_ACEITA: { label: "Proposta aceita", tone: "info" },
  AGUARDANDO_PAGAMENTO: { label: "Aguardando pagamento", tone: "warning" },
  PAGAMENTO_APROVADO: { label: "Pagamento aprovado", tone: "success" },
  EM_ANDAMENTO: { label: "Em andamento", tone: "info" },
  CONCLUIDO: { label: "Concluído", tone: "success" },
  CANCELADO: { label: "Cancelado", tone: "neutral" },
  ESTORNADO: { label: "Estornado", tone: "danger" },
};

const proposalLabels: Record<ProposalStatus, { label: string; tone: Tone }> = {
  ENVIADA: { label: "Enviada", tone: "info" },
  ACEITA: { label: "Aceita", tone: "success" },
  RECUSADA: { label: "Recusada", tone: "neutral" },
  EXPIRADA: { label: "Expirada", tone: "neutral" },
};

const paymentLabels: Record<PaymentStatus, { label: string; tone: Tone }> = {
  PENDENTE: { label: "Pendente", tone: "warning" },
  APROVADO: { label: "Aprovado", tone: "success" },
  RECUSADO: { label: "Recusado", tone: "danger" },
  CANCELADO: { label: "Cancelado", tone: "neutral" },
  ESTORNADO: { label: "Estornado", tone: "danger" },
  CHARGEBACK: { label: "Chargeback", tone: "danger" },
};

const payoutLabels: Record<PayoutStatus, { label: string; tone: Tone }> = {
  PENDENTE: { label: "Pendente", tone: "warning" },
  PROCESSANDO: { label: "Processando", tone: "info" },
  PAGO: { label: "Pago", tone: "success" },
  FALHOU: { label: "Falhou", tone: "danger" },
};

const userStatusLabels: Record<UserStatus, { label: string; tone: Tone }> = {
  ATIVO: { label: "Ativo", tone: "success" },
  BLOQUEADO: { label: "Bloqueado", tone: "danger" },
  PENDENTE_VERIFICACAO: { label: "Verificação pendente", tone: "warning" },
};

const approvalLabels: Record<ProviderApprovalStatus, { label: string; tone: Tone }> = {
  PENDENTE: { label: "Pendente", tone: "warning" },
  APROVADO: { label: "Aprovado", tone: "success" },
  REPROVADO: { label: "Reprovado", tone: "danger" },
};

export function formatStatus(status: string): { label: string; tone: Tone } {
  return (
    requestLabels[status as ServiceRequestStatus] ??
    proposalLabels[status as ProposalStatus] ??
    paymentLabels[status as PaymentStatus] ??
    payoutLabels[status as PayoutStatus] ??
    userStatusLabels[status as UserStatus] ??
    approvalLabels[status as ProviderApprovalStatus] ?? { label: status, tone: "neutral" as Tone }
  );
}

/** Ordem cronológica dos estados de um serviço, usada na timeline. */
export const serviceTimeline: ServiceRequestStatus[] = [
  "SOLICITADO",
  "PROPOSTAS_RECEBIDAS",
  "AGUARDANDO_PAGAMENTO",
  "PAGAMENTO_APROVADO",
  "EM_ANDAMENTO",
  "CONCLUIDO",
];

export const requestFilters: { value: "TODAS" | ServiceRequestStatus; label: string }[] = [
  { value: "TODAS", label: "Todas" },
  { value: "SOLICITADO", label: "Abertas" },
  { value: "PROPOSTAS_RECEBIDAS", label: "Com propostas" },
  { value: "AGUARDANDO_PAGAMENTO", label: "Aguardando pagamento" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "CONCLUIDO", label: "Concluídas" },
  { value: "CANCELADO", label: "Canceladas" },
];
