import crypto from "crypto";
import { MercadoPagoConfig, Preference, Payment as MPPayment } from "mercadopago";
import { env } from "../config/env";
import { decryptSecret } from "../utils/secret";
import {
  PaymentProvider,
  CreateCheckoutInput,
  CreateCheckoutOutput,
  WebhookVerificationResult,
  GatewayPaymentStatus,
  RefundInput,
} from "./PaymentProvider";

// Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/marketplace
// Split de marketplace no Mercado Pago é feito via `marketplace_fee` (valor retido pela
// plataforma) associado à conta do vendedor (prestador), usando `application_id` do
// marketplace e o access_token/collector do prestador conectado via OAuth.
// Em sandbox, use as credenciais de TESTE (prefixo TEST-).

export class MercadoPagoProvider implements PaymentProvider {
  readonly name = "MERCADO_PAGO" as const;
  private client: MercadoPagoConfig;

  constructor() {
    if (!env.mercadoPago.accessToken) {
      throw new Error(
        "MERCADOPAGO_ACCESS_TOKEN não configurado. Defina-o no .env com uma credencial de sandbox."
      );
    }
    this.client = new MercadoPagoConfig({ accessToken: env.mercadoPago.accessToken });
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    if (!input.providerPaymentAccessToken) {
      throw new Error("Prestador ainda não conectou sua conta Mercado Pago via OAuth.");
    }
    const sellerClient = new MercadoPagoConfig({ accessToken: input.providerPaymentAccessToken });
    const preference = new Preference(sellerClient);

    const result = await preference.create({
      body: {
        items: [
          {
            id: input.orderId,
            title: input.description,
            quantity: 1,
            unit_price: input.grossAmountInCents / 100,
            currency_id: "BRL",
          },
        ],
        payer: { email: input.payerEmail },
        // marketplace_fee: valor que a plataforma retém — o restante é liquidado
        // para a conta do vendedor conectado (providerPaymentAccountId via OAuth do MP)
        marketplace_fee: input.commissionAmountInCents / 100,
        back_urls: {
          success: input.successUrl,
          failure: input.failureUrl,
          pending: input.pendingUrl,
        },
        auto_return: "approved",
        notification_url: input.notificationUrl,
        external_reference: input.orderId,
        statement_descriptor: "CONECTASERVICOS",
      },
      requestOptions: { idempotencyKey: input.idempotencyKey },
    });

    return {
      externalPreferenceId: result.id!,
      checkoutUrl: result.init_point ?? result.sandbox_init_point ?? "",
    };
  }

  verifyWebhookSignature(
    headers: Record<string, string | string[] | undefined>,
    rawBody: Buffer
  ): WebhookVerificationResult {
    // Mercado Pago assina o webhook no header `x-signature` (formato ts=...,v1=...)
    // combinado com `x-request-id`. Ver: docs.mercadopago.com/webhooks/notifications
    const signatureHeader = headers["x-signature"];
    const requestIdHeader = headers["x-request-id"];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    const requestId = Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader;

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody.toString("utf-8"));
    } catch {
      return { valid: false, eventType: "unknown", rawPayload: rawBody.toString("utf-8") };
    }

    if (!signature || !env.mercadoPago.webhookSecret) {
      return { valid: false, eventType: payload.type ?? "unknown", rawPayload: payload };
    }

    const parts = signature.split(",").reduce<Record<string, string>>((acc, part) => {
      const [k, v] = part.split("=");
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {});

    const ts = parts["ts"];
    const v1 = parts["v1"];
    const dataId = payload.data?.id ?? "";
    const manifest = `id:${dataId};request-id:${requestId ?? ""};ts:${ts};`;
    const expectedSignature = crypto
      .createHmac("sha256", env.mercadoPago.webhookSecret)
      .update(manifest)
      .digest("hex");

    const valid = Boolean(v1) && crypto.timingSafeEqual(
      Buffer.from(v1 ?? "", "utf-8").length === Buffer.from(expectedSignature, "utf-8").length
        ? Buffer.from(v1 ?? "", "utf-8")
        : Buffer.alloc(0),
      Buffer.from(v1 ?? "", "utf-8").length === Buffer.from(expectedSignature, "utf-8").length
        ? Buffer.from(expectedSignature, "utf-8")
        : Buffer.alloc(1)
    );

    return {
      valid,
      eventType: payload.type ?? payload.action ?? "unknown",
      externalPaymentId: String(dataId),
      rawPayload: payload,
    };
  }

  async getPaymentStatus(externalPaymentId: string, sellerAccessToken?: string): Promise<GatewayPaymentStatus> {
    const paymentApi = new MPPayment(new MercadoPagoConfig({ accessToken: sellerAccessToken ?? env.mercadoPago.accessToken }));
    const payment = await paymentApi.get({ id: Number(externalPaymentId) });

    const statusMap: Record<string, GatewayPaymentStatus["status"]> = {
      approved: "approved",
      pending: "pending",
      in_process: "pending",
      rejected: "rejected",
      cancelled: "cancelled",
      refunded: "refunded",
      charged_back: "charged_back",
    };

    return {
      externalPaymentId,
      status: statusMap[payment.status ?? "pending"] ?? "pending",
      grossAmountInCents: Math.round((payment.transaction_amount ?? 0) * 100),
      externalReference: payment.external_reference ? String(payment.external_reference) : undefined,
      gatewayFeeInCents: Math.round(
        (payment.fee_details?.reduce((sum, f) => sum + (f.amount ?? 0), 0) ?? 0) * 100
      ),
    };
  }

  async refund(input: RefundInput): Promise<{ success: boolean; externalRefundId?: string }> {
    const accessToken = input.providerPaymentAccessToken ?? env.mercadoPago.accessToken;
    const paymentId = encodeURIComponent(input.externalPaymentId);
    const body = input.amountInCents
      ? JSON.stringify({ amount: input.amountInCents / 100 })
      : undefined;

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}/refunds`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body,
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Mercado Pago refund failed (${response.status}): ${errorBody || response.statusText}`
      );
    }

    const result = (await response.json()) as { id?: string | number };
    return { success: true, externalRefundId: String(result.id ?? "") };
  }
}
