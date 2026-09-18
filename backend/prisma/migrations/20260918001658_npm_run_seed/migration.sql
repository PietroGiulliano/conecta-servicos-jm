-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "commissions" DROP CONSTRAINT "commissions_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_customerId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_proposalId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_providerId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_serviceRequestId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_orderId_fkey";

-- DropForeignKey
ALTER TABLE "payouts" DROP CONSTRAINT "payouts_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "payouts" DROP CONSTRAINT "payouts_walletId_fkey";

-- DropForeignKey
ALTER TABLE "proposals" DROP CONSTRAINT "proposals_providerId_fkey";

-- DropForeignKey
ALTER TABLE "provider_profiles" DROP CONSTRAINT "provider_profiles_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "provider_wallets" DROP CONSTRAINT "provider_wallets_providerId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_customerId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_orderId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_providerId_fkey";

-- DropForeignKey
ALTER TABLE "service_requests" DROP CONSTRAINT "service_requests_addressId_fkey";

-- DropForeignKey
ALTER TABLE "service_requests" DROP CONSTRAINT "service_requests_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "service_requests" DROP CONSTRAINT "service_requests_customerId_fkey";

-- DropForeignKey
ALTER TABLE "service_requests" DROP CONSTRAINT "service_requests_targetProviderId_fkey";

-- AlterTable
ALTER TABLE "addresses" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "commissions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "company_profiles" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "customer_profiles" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "disputes" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "favorites" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gallery_items" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "messages" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "password_reset_tokens" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment_oauth_states" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment_transactions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payouts" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "platform_settings" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "proposals" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "provider_documents" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "provider_profiles" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "provider_wallets" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "refresh_tokens" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "reviews" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "service_requests" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "service_status_events" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_targetProviderId_fkey" FOREIGN KEY ("targetProviderId") REFERENCES "provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_wallets" ADD CONSTRAINT "provider_wallets_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "provider_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
