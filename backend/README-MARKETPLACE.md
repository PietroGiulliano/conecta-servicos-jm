# ConectaServiços — marketplace B2B/B2C

## O que foi implementado

- Papel `EMPRESA` além de cliente, prestador e administrador.
- Empresas podem se cadastrar e usar o mesmo fluxo de solicitação de serviços.
- Endpoint para perfil e histórico de solicitações da empresa.
- Prestadores recebem solicitações por categoria/cidade.
- Comissão da plataforma configurável (padrão 10%) e congelada por pedido.
- Integração preparada para split real do Mercado Pago via OAuth do prestador.
- Access/refresh tokens do Mercado Pago são armazenados criptografados no banco.
- Webhook usa o `user_id` do Mercado Pago para identificar o prestador quando a notificação inicial chegar.
- URL pública do webhook separada da URL do frontend.
- Stripe mantém o modelo de destination charge/application fee como alternativa.
- Proteções adicionais no início/conclusão de serviços e na leitura de solicitações.

## Fluxo de pagamento Mercado Pago

1. Prestador cria conta.
2. Prestador chama `GET /api/providers/payment/mercadopago/connect`.
3. Backend devolve a URL OAuth.
4. Prestador autoriza sua conta Mercado Pago.
5. Callback grava as credenciais OAuth criptografadas.
6. Cliente/empresa aceita uma proposta.
7. O checkout é criado usando o access token OAuth do prestador e `marketplace_fee`.
8. O Mercado Pago realiza o split da transação.
9. O webhook confirma o pagamento e atualiza a carteira interna/auditoria.

A documentação do Mercado Pago exige OAuth individual por vendedor para o split 1:1. Configure o Redirect URL da aplicação exatamente igual ao `MERCADOPAGO_OAUTH_REDIRECT_URI`.

## Variáveis adicionais

```env
PUBLIC_API_URL="https://api.seudominio.com"
MERCADOPAGO_CLIENT_ID="SEU_APP_ID"
MERCADOPAGO_CLIENT_SECRET="SUA_CLIENT_SECRET"
MERCADOPAGO_OAUTH_REDIRECT_URI="https://api.seudominio.com/api/providers/payment/mercadopago/callback"
MERCADOPAGO_TEST_TOKEN="true"
```

## Banco

Depois de configurar `DATABASE_URL`:

```bash
npx prisma generate
npx prisma migrate deploy
```

Em desenvolvimento:

```bash
npx prisma migrate dev
```

## Endpoints principais

### Empresa

- `POST /api/auth/register/empresa`
- `GET /api/companies/me`
- `PUT /api/companies/me`
- `GET /api/companies/me/requests`
- `POST /api/service-requests`

### Prestador / Mercado Pago

- `GET /api/providers/payment/mercadopago/connect`
- `GET /api/providers/payment/mercadopago/callback`
- `GET /api/providers/payment/status`

### Pagamento

- `POST /api/payments/checkout`
- `POST /api/payments/webhook`

### Autenticação

- `POST /api/auth/forgot-password` — gera token de redefinição (válido 1h, uso único), grava o hash em `password_reset_tokens` e envia email via SMTP (ou imprime o link no console se SMTP não estiver configurado).
- `POST /api/auth/reset-password` — recebe `{ token, newPassword }`, troca a senha e revoga todas as sessões ativas do usuário.

### Upload de arquivos

- `POST /api/uploads` (autenticado) — `multipart/form-data`, campo `file` (JPG/PNG/WEBP/PDF, até 5MB). Devolve `{ url }`. Arquivos ficam em `UPLOAD_DIR` e são servidos em `GET /uploads/<nome>`. Em produção, trocar o `diskStorage` por um bucket (S3/R2) antes de escalar horizontalmente — hoje os arquivos vivem no disco local do processo.

> O split financeiro real depende da configuração da aplicação do gateway, OAuth dos prestadores e credenciais de produção/sandbox. O código não deve ser considerado pronto para dinheiro real sem executar testes de sandbox e validar as regras comerciais, fiscais e contratuais da operação.
