import Stripe from "stripe";
import { env } from "../config/env";
import {
  PaymentProvider,
  CreateCheckoutInput,
  CreateCheckoutOutput,
  WebhookVerificationResult,
  GatewayPaymentStatus,
  RefundInput,
} from "./PaymentProvider";

// Documentação: https://stripe.com/docs/connect/destination-charges
// Split é feito com `application_fee_amount` (retido pela plataforma) + `transfer_data.destination`
// (id da conta conectada do prestador, criada via Stripe Connect Express/Standard).
// Em sandbox, use chaves de TESTE (sk_test_...) e o modo de teste do Connect.

export class StripeProvider implements PaymentProvider {
  readonly name = "STRIPE" as const;
  private client: Stripe;

  constructor() {
    if (!env.stripe.secretKey) {
      throw new Error("STRIPE_SECRET_KEY não configurado. Defina-o no .env com uma chave de teste.");
    }
    this.client = new Stripe(env.stripe.secretKey, { apiVersion: "2024-06-20" });
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    if (!input.providerPaymentAccountId) {
      throw new Error(
        "Prestador ainda não conectou uma conta de recebimento Stripe Connect. Não é possível processar o split."
      );
    }

    const session = await this.client.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card", "pix"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: { name: input.description },
              unit_amount: input.grossAmountInCents,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          metadata: { orderId: input.orderId },
          application_fee_amount: input.commissionAmountInCents,
          transfer_data: { destination: input.providerPaymentAccountId },
        },
        customer_email: input.payerEmail,
        success_url: input.successUrl,
        cancel_url: input.failureUrl,
        client_reference_id: input.orderId,
      },
      { idempotencyKey: input.idempotencyKey }
    );

    return {
      externalPreferenceId: session.id,
      checkoutUrl: session.url ?? "",
    };
  }

  verifyWebhookSignature(
    headers: Record<string, string | string[] | undefined>,
    rawBody: Buffer
  ): WebhookVerificationResult {
    const sigHeader = headers["stripe-signature"];
    const signature = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;
    try {
      const event = this.client.webhooks.constructEvent(
        rawBody,
        signature ?? "",
        env.stripe.webhookSecret
      );
      const paymentIntent = (event.data.object as any)?.id;
      const metadata = (event.data.object as any)?.metadata ?? {};
      return { valid: true, eventType: event.type, externalPaymentId: paymentIntent, rawPayload: { event, externalReference: metadata.orderId } };
    } catch (err) {
      return { valid: false, eventType: "unknown", rawPayload: String(err) };
    }
  }

  async getPaymentStatus(externalPaymentId: string): Promise<GatewayPaymentStatus> {
    const intent = await this.client.paymentIntents.retrieve(externalPaymentId);
    const statusMap: Record<string, GatewayPaymentStatus["status"]> = {
      succeeded: "approved",
      processing: "pending",
      requires_payment_method: "rejected",
      canceled: "cancelled",
    };
    return {
      externalPaymentId,
      externalReference: intent.metadata?.orderId,
      status: statusMap[intent.status] ?? "pending",
      grossAmountInCents: intent.amount,
    };
  }

  async refund(input: RefundInput): Promise<{ success: boolean; externalRefundId?: string }> {
    const refund = await this.client.refunds.create({
      payment_intent: input.externalPaymentId,
      amount: input.amountInCents,
    });
    return { success: refund.status === "succeeded" || refund.status === "pending", externalRefundId: refund.id };
  }
}
