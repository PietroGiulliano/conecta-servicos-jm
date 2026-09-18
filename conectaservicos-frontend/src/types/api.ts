// Tipos espelhados diretamente do schema Prisma e das respostas do backend.
// Nenhum campo aqui é inventado: todos existem em prisma/schema.prisma ou nas
// funções de serialização das rotas (ex.: publicProviderCard/publicProviderProfile).

export type UserRole = "CLIENTE" | "EMPRESA" | "PRESTADOR" | "ADMIN";
export type UserStatus = "ATIVO" | "BLOQUEADO" | "PENDENTE_VERIFICACAO";
export type ProviderApprovalStatus = "PENDENTE" | "APROVADO" | "REPROVADO";

export type ServiceRequestStatus =
  | "SOLICITADO"
  | "PROPOSTAS_RECEBIDAS"
  | "PROPOSTA_ACEITA"
  | "AGUARDANDO_PAGAMENTO"
  | "PAGAMENTO_APROVADO"
  | "EM_ANDAMENTO"
  | "CONCLUIDO"
  | "CANCELADO"
  | "ESTORNADO";

export type ProposalStatus = "ENVIADA" | "ACEITA" | "RECUSADA" | "EXPIRADA";

export type PaymentStatus =
  | "PENDENTE"
  | "APROVADO"
  | "RECUSADO"
  | "CANCELADO"
  | "ESTORNADO"
  | "CHARGEBACK";

export type PaymentMethod = "PIX" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "OUTRO";
export type PaymentGateway = "MERCADO_PAGO" | "STRIPE";
export type PayoutStatus = "PENDENTE" | "PROCESSANDO" | "PAGO" | "FALHOU";

export type NotificationType =
  | "NOVA_SOLICITACAO"
  | "NOVA_PROPOSTA"
  | "PROPOSTA_ACEITA"
  | "PAGAMENTO_APROVADO"
  | "PAGAMENTO_PENDENTE"
  | "SERVICO_INICIADO"
  | "SERVICO_CONCLUIDO"
  | "NOVA_MENSAGEM"
  | "NOVA_AVALIACAO"
  | "REPASSE_REALIZADO";

/** Decimais do Prisma chegam ao frontend como string no JSON. */
export type Decimal = string | number;

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconKey: string | null;
  active: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  role: UserRole;
}

export interface AddressInput {
  street: string;
  number?: string;
  complement?: string;
  district?: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface ProviderCard {
  id: string;
  professionalName: string;
  photoUrl: string | null;
  category?: string;
  ratingAverage: Decimal;
  ratingCount: number;
  citiesServed: string[];
  bio?: string | null;
  startingPrice: Decimal;
}

export interface ProviderReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customerName?: string;
}

export interface ProviderPublicProfile extends ProviderCard {
  availability: unknown;
  gallery: { id: string; imageUrl: string; caption: string | null }[];
  reviews: ProviderReview[];
}

export interface ProviderDocument {
  id: string;
  providerId: string;
  type: string;
  fileUrl: string;
  verified: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

export interface Payout {
  id: string;
  walletId: string;
  paymentId: string | null;
  amount: Decimal;
  status: PayoutStatus;
  externalTransferId: string | null;
  requestedAt: string;
  paidAt: string | null;
}

export interface ProviderWallet {
  id: string;
  providerId: string;
  availableBalance: Decimal;
  pendingBalance: Decimal;
  totalReceived: Decimal;
  totalCommission: Decimal;
  totalFees: Decimal;
  updatedAt: string;
  payouts?: Payout[];
}

export interface ProviderOwnProfile {
  id: string;
  userId: string;
  professionalName: string;
  documentNumber: string | null;
  photoUrl: string | null;
  bio: string | null;
  categoryId: string | null;
  specialties: string[];
  citiesServed: string[];
  serviceRadiusKm: number | null;
  startingPrice: Decimal;
  approvalStatus: ProviderApprovalStatus;
  ratingAverage: Decimal;
  ratingCount: number;
  paymentAccountId: string | null;
  createdAt: string;
  category?: Category | null;
  documents?: ProviderDocument[];
  wallet?: ProviderWallet | null;
  user?: { id: string; name: string; email: string; phone: string | null; status: UserStatus };
}

export interface CompanyProfile {
  id: string;
  userId: string;
  legalName: string;
  tradeName: string | null;
  documentNumber: string;
  city: string;
  state: string;
  industry: string | null;
  website: string | null;
  description: string | null;
  verified: boolean;
  createdAt: string;
  user?: { id: string; name: string; email: string; phone: string | null; role: UserRole; status: UserStatus };
}

export interface Address {
  id: string;
  street: string;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string;
  state: string;
  zipCode: string;
}

export interface Proposal {
  id: string;
  serviceRequestId: string;
  providerId: string;
  value: Decimal;
  description: string;
  estimatedDays: number | null;
  availableDate: string | null;
  notes: string | null;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  provider?: ProviderOwnProfile;
  serviceRequest?: ServiceRequest;
}

export interface ServiceStatusEvent {
  id: string;
  serviceRequestId: string;
  status: ServiceRequestStatus;
  note: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  serviceRequestId: string;
  proposalId: string;
  customerId: string;
  providerId: string;
  grossAmount: Decimal;
  commissionRate: Decimal;
  commissionAmount: Decimal;
  providerAmount: Decimal;
  createdAt: string;
  updatedAt: string;
  payment?: Payment | null;
  serviceRequest?: ServiceRequest;
  provider?: ProviderOwnProfile;
  customer?: { id: string; userId: string };
  review?: Review | null;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  categoryId: string;
  targetProviderId: string | null;
  title: string;
  description: string;
  photos: string[];
  addressId: string | null;
  city: string;
  desiredDate: string | null;
  desiredTime: string | null;
  approxBudget: Decimal | null;
  status: ServiceRequestStatus;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  address?: Address | null;
  proposals?: Proposal[];
  order?: Order | null;
  statusHistory?: ServiceStatusEvent[];
  customer?: { id: string; userId: string; user?: { name: string; email: string } };
}

export interface Payment {
  id: string;
  orderId: string;
  gateway: PaymentGateway;
  method: PaymentMethod;
  status: PaymentStatus;
  grossAmount: Decimal;
  gatewayFeeAmount: Decimal | null;
  commissionAmount: Decimal;
  providerNetAmount: Decimal;
  externalPaymentId: string | null;
  externalPreferenceId: string | null;
  approvedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
  order?: Order;
}

/** Resposta de POST /payments/checkout */
export interface CheckoutResponse {
  payment: Payment;
  checkoutUrl?: string;
  qrCode?: string;
  qrCodeBase64?: string;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  providerId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  serviceRequestId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: unknown;
  readAt: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface AdminDashboard {
  totalUsers: number;
  totalCustomers: number;
  totalCompanies: number;
  totalProviders: number;
  servicesInProgress: number;
  servicesCompleted: number;
  cancellations: number;
  grossVolume: Decimal;
  totalCommission: Decimal;
  totalProviderPayout: Decimal;
  approvedPaymentsCount: number;
}

export interface AdminGrowth {
  payments: { month: string; gross: number; commission: number; count: number }[];
  users: { month: string; count: number }[];
}

export interface FinancialReport {
  count: number;
  totals: { grossVolume: number; commissions: number; fees: number; refunds: number; netAmount: number };
  payments: Payment[];
}

export interface Favorite {
  id: string;
  customerId: string;
  providerId: string;
  createdAt: string;
  provider?: ProviderOwnProfile;
}

export interface ProviderPaymentStatus {
  connected: boolean;
  expiresAt: string | null;
}
