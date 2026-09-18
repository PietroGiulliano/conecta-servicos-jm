import { v4 as uuid } from "uuid";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/errorHandler";
import { getPaymentProvider } from "../../payments";
import { env } from "../../config/env";
import { notifyUser } from "../notifications/notifications.service";
import { decryptSecret } from "../../utils/secret";

export async function createCheckout(orderId: string, method: "PIX" | "CARTAO_CREDITO", payerEmail: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { provider: true, customer: { include: { user: true } }, payment: true, serviceRequest: true },
  });
  if (!order) throw new AppError("Pedido não encontrado.", 404);
  if (order.payment && order.payment.status === "APROVADO") {
    throw new AppError("Este pedido já foi pago.", 409);
  }

  const provider = getPaymentProvider();
  const idempotencyKey = order.payment?.idempotencyKey ?? uuid();

  const checkout = await provider.createCheckout({
    orderId: order.id,
    description: `Serviço: ${order.serviceRequest.title}`,
    grossAmountInCents: Math.round(Number(order.grossAmount) * 100),
    commissionAmountInCents: Math.round(Number(order.commissionAmount) * 100),
    providerAmountInCents: Math.round(Number(order.providerAmount) * 100),
    providerPaymentAccountId: order.provider.paymentAccountId,
    providerPaymentAccessToken: order.provider.mpAccessTokenEncrypted ? decryptSecret(order.provider.mpAccessTokenEncrypted) : null,
    payerEmail,
    idempotencyKey,
    successUrl: `${env.frontendUrl}/pedidos/${order.id}/pagamento/sucesso`,
    failureUrl: `${env.frontendUrl}/pedidos/${order.id}/pagamento/falha`,
    pendingUrl: `${env.frontendUrl}/pedidos/${order.id}/pagamento/pendente`,
    notificationUrl: `${env.publicApiUrl.replace(/\/$/, "")}/api/payments/webhook`,
  });

  const payment = await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      gateway: provider.name,
      method,
      status: "PENDENTE",
      grossAmount: order.grossAmount,
      commissionAmount: order.commissionAmount,
      providerNetAmount: order.providerAmount,
      externalPreferenceId: checkout.externalPreferenceId,
      idempotencyKey,
    },
    update: {
      externalPreferenceId: checkout.externalPreferenceId,
      method,
      status: "PENDENTE",
    },
  });

  return { payment, checkoutUrl: checkout.checkoutUrl, qrCode: checkout.qrCode };
}

// Ponto crítico: um pagamento só é considerado aprovado quando o webhook do
// gateway confirma isso — nunca por uma resposta otimista do frontend.
export async function handleWebhook(
  headers: Record<string, string | string[] | undefined>,
  rawBody: Buffer
) {
  const provider = getPaymentProvider();
  const verification = provider.verifyWebhookSignature(headers, rawBody);

  if (!verification.valid) {
    // Registra a tentativa para auditoria, mas não processa
    console.warn("[webhook] assinatura inválida recebida", verification.eventType);
    throw new AppError("Assinatura de webhook inválida.", 401);
  }

  if (!verification.externalPaymentId) {
    return { ignored: true };
  }

  const matchedByExternal = await prisma.payment.findFirst({ where: { externalPaymentId: verification.externalPaymentId } });
  const payload: any = verification.rawPayload;
  const sellerToken = matchedByExternal
    ? await getProviderPaymentToken(matchedByExternal.orderId)
    : await getProviderPaymentTokenByCollectorId(payload?.user_id);
  const status = await provider.getPaymentStatus(verification.externalPaymentId, sellerToken);

  // O id da preferência/sessão difere do id do pagamento em alguns gateways, então
  // casamos pelo external_reference (= orderId) que enviamos na criação do checkout.
  const matchedPayment = await findPaymentByExternalReference(verification, status.externalReference);

  if (!matchedPayment) {
    console.warn("[webhook] pagamento não localizado para o evento", verification.externalPaymentId);
    return { ignored: true };
  }

  await prisma.paymentTransaction.create({
    data: {
      paymentId: matchedPayment.id,
      eventType: verification.eventType,
      rawPayload: verification.rawPayload as any,
      signatureValid: true,
    },
  });

  const statusMap: Record<string, "APROVADO" | "PENDENTE" | "RECUSADO" | "CANCELADO" | "ESTORNADO" | "CHARGEBACK"> = {
    approved: "APROVADO",
    pending: "PENDENTE",
    rejected: "RECUSADO",
    cancelled: "CANCELADO",
    refunded: "ESTORNADO",
    charged_back: "CHARGEBACK",
  };
  const newStatus = statusMap[status.status];

  if (newStatus === matchedPayment.status) {
    return { ok: true, unchanged: true }; // idempotência: evento já processado
  }

  await prisma.payment.update({
    where: { id: matchedPayment.id },
    data: {
      status: newStatus,
      externalPaymentId: verification.externalPaymentId,
      gatewayFeeAmount: status.gatewayFeeInCents ? status.gatewayFeeInCents / 100 : undefined,
      approvedAt: newStatus === "APROVADO" ? new Date() : matchedPayment.approvedAt,
      refundedAt: newStatus === "ESTORNADO" ? new Date() : matchedPayment.refundedAt,
    },
  });

  if (newStatus === "APROVADO") {
    await onPaymentApproved(matchedPayment.id);
  } else if (newStatus === "ESTORNADO" || newStatus === "CHARGEBACK") {
    await onPaymentReversed(matchedPayment.id, newStatus);
  }

  return { ok: true };
}

async function findPaymentByExternalReference(verification: { externalPaymentId?: string; rawPayload: unknown }, externalReference?: string) {
  // Mercado Pago/Stripe devolvem o external_reference (= orderId) no payload —
  // usamos isso para localizar o pagamento de forma confiável.
  const payload: any = verification.rawPayload;
  const orderId =
    externalReference ?? payload?.data?.external_reference ?? payload?.data?.object?.metadata?.orderId ?? payload?.data?.object?.client_reference_id ?? payload?.external_reference;
  if (orderId) {
    return prisma.payment.findUnique({ where: { orderId } });
  }
  // fallback: casar pelo externalPaymentId já armazenado (segunda notificação do mesmo evento)
  return prisma.payment.findFirst({ where: { externalPaymentId: verification.externalPaymentId } });
}

async function getProviderPaymentTokenByCollectorId(collectorId: unknown): Promise<string | undefined> {
  if (!collectorId) return undefined;
  const provider = await prisma.providerProfile.findFirst({ where: { mpCollectorId: String(collectorId) } });
  if (!provider?.mpAccessTokenEncrypted) return undefined;
  return decryptSecret(provider.mpAccessTokenEncrypted);
}

async function getProviderPaymentToken(orderId: string): Promise<string | undefined> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { provider: true } });
  if (!order?.provider.mpAccessTokenEncrypted) return undefined;
  return decryptSecret(order.provider.mpAccessTokenEncrypted);
}

async function onPaymentApproved(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: { include: { provider: { include: { user: true } }, serviceRequest: true, customer: { include: { user: true } } } } },
  });
  if (!payment) return;

  await prisma.$transaction([
    prisma.commission.upsert({
      where: { paymentId },
      create: { paymentId, rateApplied: payment.order.commissionRate, amount: payment.commissionAmount },
      update: {},
    }),
    prisma.serviceRequest.update({
      where: { id: payment.order.serviceRequestId },
      data: { status: "PAGAMENTO_APROVADO", statusHistory: { create: { status: "PAGAMENTO_APROVADO" } } },
    }),
    // Crédito fica "pendente" até a conclusão do serviço, quando é liberado para saldo disponível
    prisma.providerWallet.upsert({
      where: { providerId: payment.order.providerId },
      create: {
        providerId: payment.order.providerId,
        pendingBalance: payment.providerNetAmount,
        totalReceived: payment.providerNetAmount,
        totalCommission: payment.commissionAmount,
        totalFees: payment.gatewayFeeAmount ?? 0,
      },
      update: {
        pendingBalance: { increment: payment.providerNetAmount },
        totalReceived: { increment: payment.providerNetAmount },
        totalCommission: { increment: payment.commissionAmount },
        totalFees: { increment: payment.gatewayFeeAmount ?? 0 },
      },
    }),
  ]);

  await notifyUser(
    payment.order.provider.user.id,
    "PAGAMENTO_APROVADO",
    "Pagamento aprovado!",
    "O pagamento do serviço foi aprovado. Você já pode iniciar o atendimento."
  );
  await notifyUser(
    payment.order.customer.user.id,
    "PAGAMENTO_APROVADO",
    "Pagamento confirmado",
    "Seu pagamento foi aprovado e o prestador foi notificado."
  );
}

async function onPaymentReversed(paymentId: string, status: "ESTORNADO" | "CHARGEBACK") {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
  if (!payment) return;

  await prisma.$transaction([
    prisma.serviceRequest.update({
      where: { id: payment.order.serviceRequestId },
      data: { status: "ESTORNADO", statusHistory: { create: { status: "ESTORNADO", note: status } } },
    }),
    prisma.providerWallet.update({
      where: { providerId: payment.order.providerId },
      data: { pendingBalance: { decrement: payment.providerNetAmount } },
    }),
  ]);
}

// Chamado quando o cliente/admin marca o serviço como concluído: libera o saldo
// pendente do prestador para saldo disponível (pronto para repasse).
export async function releaseProviderFunds(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true, provider: true } });
  if (!order?.payment || order.payment.status !== "APROVADO") {
    throw new AppError("Pagamento não aprovado para este pedido.", 409);
  }
  await prisma.providerWallet.update({
    where: { providerId: order.providerId },
    data: {
      pendingBalance: { decrement: order.providerAmount },
      availableBalance: { increment: order.providerAmount },
    },
  });
}

export async function refundOrder(orderId: string, reason: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true, provider: true } });
  if (!order?.payment?.externalPaymentId) {
    throw new AppError("Pagamento não encontrado ou ainda não processado pelo gateway.", 404);
  }
  const provider = getPaymentProvider();
  const sellerToken = order.provider.mpAccessTokenEncrypted ? decryptSecret(order.provider.mpAccessTokenEncrypted) : undefined;
  const result = await provider.refund({ externalPaymentId: order.payment.externalPaymentId, providerPaymentAccessToken: sellerToken });
  if (!result.success) throw new AppError("Não foi possível processar o estorno no gateway.", 502);

  await prisma.auditLog.create({
    data: { action: "REFUND", entity: "Order", entityId: order.id, metadata: { reason } },
  });
  return result;
}
