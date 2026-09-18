import { env } from "../config/env";
import { PaymentProvider } from "./PaymentProvider";
import { MercadoPagoProvider } from "./MercadoPagoProvider";
import { StripeProvider } from "./StripeProvider";

let cachedProvider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cachedProvider) return cachedProvider;

  cachedProvider =
    env.activePaymentProvider === "STRIPE" ? new StripeProvider() : new MercadoPagoProvider();

  return cachedProvider;
}

export * from "./PaymentProvider";
