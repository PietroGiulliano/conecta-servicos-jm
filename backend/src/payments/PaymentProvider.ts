// Camada de abstração de pagamentos: qualquer gateway (Mercado Pago, Stripe, ou outro)
// implementa esta interface. Isso permite trocar o provider sem reescrever o
// restante da aplicação (checkout, webhooks, carteira, repasses).

export interface CreateCheckoutInput {
  orderId: string;
  description: string;
  grossAmountInCents: number;
  commissionAmountInCents: number;
  providerAmountInCents: number;
  // conta de recebimento do prestador no gateway (ex: id do vendedor no Mercado Pago
  // ou id da conta conectada no Stripe Connect)
  providerPaymentAccountId: string | null;
  providerPaymentAccessToken?: string | null;
  payerEmail: string;
  idempotencyKey: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl: string;
}

export interface CreateCheckoutOutput {
  externalPreferenceId: string;
  checkoutUrl: string;
  // Alguns métodos (ex: PIX) retornam dados de pagamento direto, sem redirecionamento
  qrCode?: string;
  qrCodeBase64?: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  eventType: string;
  externalPaymentId?: string;
  rawPayload: unknown;
}

export interface GatewayPaymentStatus {
  externalPaymentId: string;
  status: "approved" | "pending" | "rejected" | "cancelled" | "refunded" | "charged_back";
  grossAmountInCents: number;
  gatewayFeeInCents?: number;
  externalReference?: string;
}

export interface RefundInput {
  externalPaymentId: string;
  providerPaymentAccessToken?: string;
  amountInCents?: number; // omitido = reembolso total
}

export interface PaymentProvider {
  readonly name: "MERCADO_PAGO" | "STRIPE";

  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutOutput>;

  // Verifica a assinatura do webhook e extrai o evento. NUNCA confie em um
  // webhook sem essa verificação — é o que impede que alguém finja um pagamento aprovado.
  verifyWebhookSignature(headers: Record<string, string | string[] | undefined>, rawBody: Buffer): WebhookVerificationResult;

  getPaymentStatus(externalPaymentId: string, sellerAccessToken?: string): Promise<GatewayPaymentStatus>;

  refund(input: RefundInput): Promise<{ success: boolean; externalRefundId?: string }>;
}
