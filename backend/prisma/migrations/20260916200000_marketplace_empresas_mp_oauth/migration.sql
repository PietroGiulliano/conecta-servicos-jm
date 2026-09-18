CREATE TYPE "UserRole" AS ENUM ('CLIENTE', 'EMPRESA', 'PRESTADOR', 'ADMIN');

CREATE TYPE "UserStatus" AS ENUM ('ATIVO', 'BLOQUEADO', 'PENDENTE_VERIFICACAO');

CREATE TYPE "ProviderApprovalStatus" AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO');

CREATE TYPE "ServiceRequestStatus" AS ENUM ('SOLICITADO', 'PROPOSTAS_RECEBIDAS', 'PROPOSTA_ACEITA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_APROVADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO', 'ESTORNADO');

CREATE TYPE "ProposalStatus" AS ENUM ('ENVIADA', 'ACEITA', 'RECUSADA', 'EXPIRADA');

CREATE TYPE "PaymentStatus" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO', 'CANCELADO', 'ESTORNADO', 'CHARGEBACK');

CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'OUTRO');

CREATE TYPE "PaymentGateway" AS ENUM ('MERCADO_PAGO', 'STRIPE');

CREATE TYPE "PayoutStatus" AS ENUM ('PENDENTE', 'PROCESSANDO', 'PAGO', 'FALHOU');

CREATE TYPE "NotificationType" AS ENUM ('NOVA_SOLICITACAO', 'NOVA_PROPOSTA', 'PROPOSTA_ACEITA', 'PAGAMENTO_APROVADO', 'PAGAMENTO_PENDENTE', 'SERVICO_INICIADO', 'SERVICO_CONCLUIDO', 'NOVA_MENSAGEM', 'NOVA_AVALIACAO', 'REPASSE_REALIZADO');

CREATE TYPE "DisputeStatus" AS ENUM ('ABERTA', 'EM_ANALISE', 'RESOLVIDA', 'REJEITADA');

CREATE TABLE "users" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "phone" TEXT,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "status" "UserStatus" DEFAULT 'ATIVO' NOT NULL,
  "emailVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "users_role_idx" ON "users" ("role");

CREATE TABLE "refresh_tokens" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revoked" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens" ("userId");

CREATE TABLE "customer_profiles" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "city" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "categories" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "slug" TEXT NOT NULL UNIQUE,
  "iconKey" TEXT,
  "active" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "company_profiles" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "legalName" TEXT NOT NULL,
  "tradeName" TEXT,
  "documentNumber" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "industry" TEXT,
  "website" TEXT,
  "description" TEXT,
  "verified" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "company_profiles_city_idx" ON "company_profiles" ("city");

CREATE TABLE "provider_profiles" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "professionalName" TEXT NOT NULL,
  "documentNumber" TEXT,
  "photoUrl" TEXT,
  "bio" TEXT,
  "categoryId" TEXT,
  "specialties" TEXT[] NOT NULL,
  "citiesServed" TEXT[] NOT NULL,
  "serviceRadiusKm" INTEGER,
  "startingPrice" DECIMAL(10,2) NOT NULL,
  "availability" JSONB,
  "approvalStatus" "ProviderApprovalStatus" DEFAULT 'PENDENTE' NOT NULL,
  "ratingAverage" DECIMAL(3,2) DEFAULT 0 NOT NULL,
  "ratingCount" INTEGER DEFAULT 0 NOT NULL,
  "paymentAccountId" TEXT,
  "mpAccessTokenEncrypted" TEXT,
  "mpRefreshTokenEncrypted" TEXT,
  "mpTokenExpiresAt" TIMESTAMP(3),
  "mpCollectorId" TEXT,
  "mpPublicKey" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "provider_profiles_categoryId_idx" ON "provider_profiles" ("categoryId");

CREATE TABLE "provider_documents" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "providerId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "verified" BOOLEAN DEFAULT false NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "gallery_items" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "providerId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "caption" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "addresses" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "label" TEXT,
  "street" TEXT NOT NULL,
  "number" TEXT,
  "complement" TEXT,
  "district" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "zipCode" TEXT NOT NULL,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "favorites" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX "favorites_customerId_providerId_key" ON "favorites" ("customerId", "providerId");

CREATE TABLE "service_requests" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "targetProviderId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "photos" TEXT[] NOT NULL,
  "addressId" TEXT,
  "city" TEXT NOT NULL,
  "desiredDate" TIMESTAMP(3),
  "desiredTime" TEXT,
  "approxBudget" DECIMAL(10,2),
  "status" "ServiceRequestStatus" DEFAULT 'SOLICITADO' NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "service_requests_status_idx" ON "service_requests" ("status");

CREATE INDEX "service_requests_categoryId_idx" ON "service_requests" ("categoryId");

CREATE TABLE "service_status_events" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "serviceRequestId" TEXT NOT NULL,
  "status" "ServiceRequestStatus" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "proposals" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "serviceRequestId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "value" DECIMAL(10,2) NOT NULL,
  "description" TEXT NOT NULL,
  "estimatedDays" INTEGER,
  "availableDate" TIMESTAMP(3),
  "notes" TEXT,
  "status" "ProposalStatus" DEFAULT 'ENVIADA' NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "proposals_serviceRequestId_idx" ON "proposals" ("serviceRequestId");

CREATE TABLE "orders" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "serviceRequestId" TEXT NOT NULL UNIQUE,
  "proposalId" TEXT NOT NULL UNIQUE,
  "customerId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "grossAmount" DECIMAL(10,2) NOT NULL,
  "commissionRate" DECIMAL(5,2) NOT NULL,
  "commissionAmount" DECIMAL(10,2) NOT NULL,
  "providerAmount" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "payments" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE,
  "gateway" "PaymentGateway" NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "status" "PaymentStatus" DEFAULT 'PENDENTE' NOT NULL,
  "grossAmount" DECIMAL(10,2) NOT NULL,
  "gatewayFeeAmount" DECIMAL(10,2),
  "commissionAmount" DECIMAL(10,2) NOT NULL,
  "providerNetAmount" DECIMAL(10,2) NOT NULL,
  "externalPaymentId" TEXT,
  "externalPreferenceId" TEXT,
  "idempotencyKey" TEXT NOT NULL UNIQUE,
  "approvedAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "payments_status_idx" ON "payments" ("status");

CREATE TABLE "payment_transactions" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "paymentId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "rawPayload" JSONB NOT NULL,
  "signatureValid" BOOLEAN NOT NULL,
  "processedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX "payment_transactions_paymentId_idx" ON "payment_transactions" ("paymentId");

CREATE TABLE "commissions" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "paymentId" TEXT NOT NULL UNIQUE,
  "rateApplied" DECIMAL(5,2) NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "provider_wallets" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "providerId" TEXT NOT NULL UNIQUE,
  "availableBalance" DECIMAL(12,2) DEFAULT 0 NOT NULL,
  "pendingBalance" DECIMAL(12,2) DEFAULT 0 NOT NULL,
  "totalReceived" DECIMAL(12,2) DEFAULT 0 NOT NULL,
  "totalCommission" DECIMAL(12,2) DEFAULT 0 NOT NULL,
  "totalFees" DECIMAL(12,2) DEFAULT 0 NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "payouts" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "walletId" TEXT NOT NULL,
  "paymentId" TEXT UNIQUE,
  "amount" DECIMAL(10,2) NOT NULL,
  "status" "PayoutStatus" DEFAULT 'PENDENTE' NOT NULL,
  "externalTransferId" TEXT,
  "requestedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "paidAt" TIMESTAMP(3)
);

CREATE TABLE "reviews" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE,
  "customerId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "messages" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "serviceRequestId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX "messages_serviceRequestId_idx" ON "messages" ("serviceRequestId");

CREATE TABLE "notifications" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "data" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX "notifications_userId_idx" ON "notifications" ("userId");

CREATE TABLE "disputes" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "openedById" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "DisputeStatus" DEFAULT 'ABERTA' NOT NULL,
  "resolution" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "resolvedAt" TIMESTAMP(3)
);

CREATE TABLE "payment_oauth_states" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "providerId" TEXT NOT NULL,
  "stateHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX "payment_oauth_states_providerId_idx" ON "payment_oauth_states" ("providerId");

CREATE INDEX "payment_oauth_states_expiresAt_idx" ON "payment_oauth_states" ("expiresAt");

CREATE TABLE "platform_settings" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "audit_logs" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON UPDATE CASCADE;

ALTER TABLE "provider_documents" ADD CONSTRAINT "provider_documents_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "favorites" ADD CONSTRAINT "favorites_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "favorites" ADD CONSTRAINT "favorites_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_profiles" ("id") ON UPDATE CASCADE;

ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON UPDATE CASCADE;

ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_targetProviderId_fkey" FOREIGN KEY ("targetProviderId") REFERENCES "provider_profiles" ("id") ON UPDATE CASCADE;

ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses" ("id") ON UPDATE CASCADE;

ALTER TABLE "service_status_events" ADD CONSTRAINT "service_status_events_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "proposals" ADD CONSTRAINT "proposals_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "proposals" ADD CONSTRAINT "proposals_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider_profiles" ("id") ON UPDATE CASCADE;

ALTER TABLE "orders" ADD CONSTRAINT "orders_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests" ("id") ON UPDATE CASCADE;

ALTER TABLE "orders" ADD CONSTRAINT "orders_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals" ("id") ON UPDATE CASCADE;

ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_profiles" ("id") ON UPDATE CASCADE;

ALTER TABLE "orders" ADD CONSTRAINT "orders_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider_profiles" ("id") ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON UPDATE CASCADE;

ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commissions" ADD CONSTRAINT "commissions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments" ("id") ON UPDATE CASCADE;

ALTER TABLE "provider_wallets" ADD CONSTRAINT "provider_wallets_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider_profiles" ("id") ON UPDATE CASCADE;

ALTER TABLE "payouts" ADD CONSTRAINT "payouts_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "provider_wallets" ("id") ON UPDATE CASCADE;

ALTER TABLE "payouts" ADD CONSTRAINT "payouts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments" ("id") ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_profiles" ("id") ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider_profiles" ("id") ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_oauth_states" ADD CONSTRAINT "payment_oauth_states_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON UPDATE CASCADE;
