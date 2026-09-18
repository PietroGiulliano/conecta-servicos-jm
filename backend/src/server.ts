import { app } from "./app";
import { env, isPaymentProviderConfigured } from "./config/env";

if (!isPaymentProviderConfigured()) {
  console.warn(
    `[atenção] Gateway de pagamento "${env.activePaymentProvider}" não está configurado. ` +
      "Defina as credenciais de sandbox no .env antes de testar checkout/webhooks."
  );
}

app.listen(env.port, () => {
  console.log(`ConectaServiços API rodando em http://localhost:${env.port}`);
});
