# ConectaServiços — Frontend

> **Conectando quem precisa a quem sabe fazer.**

Interface web do marketplace ConectaServiços, construída sobre a API Node.js/Express/Prisma já existente do projeto. Todas as telas consomem rotas reais do backend — **não há dados mockados**.

Quatro experiências:

| Papel | O que faz |
|---|---|
| 👤 **CLIENTE** | Busca profissionais, publica solicitações, aceita propostas, paga e avalia |
| 🏢 **EMPRESA** | Mesma jornada com painel corporativo e dados de CNPJ |
| 🔧 **PRESTADOR** | Recebe oportunidades, envia propostas, executa serviços e acompanha a carteira |
| 🛡️ **ADMIN** | Acompanha a operação, aprova prestadores, controla comissão e denúncias |

---

## 1. Instalação

Requisitos: **Node.js 18+** e npm.

```bash
git clone <url-do-repositorio>
cd conectaservicos-frontend
```

## 2. npm install

```bash
npm install
```

## 3. Configuração do .env

Copie o exemplo e ajuste a URL da API:

```bash
cp .env.example .env
```

```env
# URL base do backend, sem barra no final
VITE_API_URL=http://localhost:4000
```

O cliente HTTP concatena `/api` automaticamente (`${VITE_API_URL}/api`). **Nenhuma URL fica fixa no código** e nenhum secret é usado no frontend.

## 4. Execução

```bash
npm run dev      # ambiente de desenvolvimento em http://localhost:5173
npm run build    # checagem de tipos + build de produção em dist/
npm run preview  # serve o build localmente
npm run lint     # apenas tsc --noEmit
```

## 5. Conexão com o backend

* O backend roda por padrão em `http://localhost:4000` e expõe tudo sob `/api`.
* O backend precisa ter `FRONTEND_URL=http://localhost:5173` no `.env` dele — o CORS está configurado com `credentials: true`, o que é obrigatório para o cookie de refresh.
* Requisições saem com `withCredentials: true`.
* Para popular a base em desenvolvimento, use o **seed do próprio backend**. Nenhum dado falso é criado pelo frontend.

## 6. Estrutura

```
src/
├─ api/          cliente Axios, interceptors de token/refresh/401
├─ assets/
├─ components/   UI base (Button, Card, Modal, Skeleton…) e componentes de domínio
├─ contexts/     AuthContext, ToastContext
├─ hooks/        useAuth, useRequest (loading/erro/retry), useNotifications
├─ layouts/      PublicLayout, AppLayout (cliente/empresa/prestador), AdminLayout
├─ lib/          utilidades de baixo nível (decode do JWT)
├─ pages/        telas por área: publico, auth, cliente, empresa, prestador, pagamento, admin
├─ routes/       definição de rotas, ProtectedRoute, RoleRoute
├─ services/     uma função por endpoint real do backend
├─ types/        modelos, DTOs e enums espelhados do Prisma
└─ utils/        formatação (moeda, data, CPF/CNPJ), status, erros
```

## 7. Autenticação

* `POST /api/auth/login` e as três rotas de registro devolvem `{ accessToken, role }`.
* O **access token fica somente em memória** (nunca em `localStorage`/`sessionStorage`).
* O **refresh token vive no cookie httpOnly `cs_refresh_token`**, emitido pelo backend — o frontend nunca o lê.
* Ao carregar a aplicação, o `AuthContext` chama `POST /api/auth/refresh` para restaurar a sessão.
* Em qualquer `401`, o interceptor tenta um refresh único e refaz a requisição; se falhar, dispara logout e redireciona para `/login`.
* `ProtectedRoute` exige sessão; `RoleRoute` restringe áreas por papel (`/empresa/*` só para EMPRESA, etc.). **Isso é apenas experiência de usuário — a autorização real é do backend.**
* Como não existe `GET /api/auth/me`, os dados de exibição do usuário vêm do payload do JWT e dos endpoints de perfil (`/providers/me/profile`, `/companies/me`). Ver "Endpoints pendentes".

## 8. Rotas

**Públicas**

| Rota | Tela |
|---|---|
| `/` | Landing page |
| `/prestadores` | Busca com filtros de categoria, cidade, avaliação e preço |
| `/prestadores/:id` | Perfil público do prestador |
| `/login` | Login |
| `/cadastro` | Escolha do tipo de conta |
| `/cadastro/cliente` `/cadastro/empresa` `/cadastro/prestador` | Formulários de registro |
| `/esqueci-senha` `/redefinir-senha` | Recuperação de senha |

**Cliente** — `/cliente/dashboard`, `/cliente/solicitacoes`, `/cliente/solicitacoes/nova`, `/cliente/solicitacoes/:id`

**Empresa** — `/empresa/dashboard`, `/empresa/solicitacoes`, `/empresa/solicitacoes/nova`, `/empresa/solicitacoes/:id`

**Prestador** — `/prestador/dashboard`, `/prestador/oportunidades`, `/prestador/oportunidades/:id`, `/prestador/propostas`, `/prestador/servicos`, `/prestador/carteira`, `/prestador/pagamentos`

**Compartilhadas** — `/chat`, `/chat/:serviceRequestId`, `/checkout/:orderId`, `/pedidos/:orderId/pagamento/sucesso|pendente|falha`

**Admin** — `/admin/dashboard`, `/admin/usuarios`, `/admin/prestadores`, `/admin/empresas`, `/admin/pagamentos`, `/admin/comissoes`, `/admin/denuncias`

> As três URLs `/pedidos/:orderId/pagamento/...` são exatamente as `back_urls` que o backend envia ao gateway. Se elas mudarem no backend, ajuste aqui também.

## 9. Pagamentos

Fluxo implementado exatamente como o backend define:

1. Aceitar proposta → `POST /api/proposals/:id/accept` cria o **Order** com a comissão congelada.
2. Redirecionamento para `/checkout/:orderId`, que carrega `GET /api/orders/:id` e exibe valor bruto, comissão e líquido **retornados pela API**.
3. `POST /api/payments/checkout` com `{ orderId, method: "PIX" | "CARTAO_CREDITO" }`:
   * **PIX** → exibe QR Code (`qrCodeBase64`), código copia e cola (`qrCode`) e botão de copiar;
   * **Cartão** → redireciona para o `checkoutUrl` seguro do gateway.
4. A confirmação vem pelo **webhook** `/api/payments/webhook`. O frontend apenas consulta o status.
5. Conclusão do serviço libera o saldo conforme as regras do backend.

**Princípio financeiro:** o frontend nunca calcula nem decide valores, aprovação, liberação ou estorno. Ele só apresenta o que a API devolve. Nenhum dado de cartão trafega ou é armazenado aqui, e nenhum token/secret do Mercado Pago aparece no bundle — a conexão do prestador usa `GET /api/providers/payment/mercadopago/connect` e o redirecionamento OAuth.

## 10. Deploy

**Frontend (Vercel)**

1. Importe o repositório na Vercel. O preset Vite é detectado automaticamente (build `npm run build`, saída `dist`).
2. Em *Settings → Environment Variables*, defina:

   ```
   VITE_API_URL = https://sua-api.onrender.com
   ```

   Variáveis `VITE_*` são lidas **em tempo de build** — após alterar, refaça o deploy.
3. O `vercel.json` incluso já faz o rewrite de SPA para `index.html`.

**Backend (Render/Railway/etc.)**

* Defina `FRONTEND_URL` com o domínio da Vercel, senão o CORS bloqueia o cookie de refresh.
* O cookie de refresh precisa de HTTPS em produção (`Secure` + `SameSite`), então frontend e backend devem estar ambos em HTTPS.
* Configure o webhook do Mercado Pago apontando para `https://sua-api/api/payments/webhook`.

---

## Endpoints pendentes no backend

Seguindo a regra do projeto, nada foi inventado. As funcionalidades abaixo têm a **camada de serviço já pronta no frontend** (em `src/services/`, marcada com `// PENDENTE NO BACKEND`) e exibem um aviso na tela quando a rota responde `404`. Basta implementar no backend para elas funcionarem sem alteração no frontend:

| Endpoint necessário | Para quê | Situação atual no frontend |
|---|---|---|
| `GET /api/auth/me` | Dados completos do usuário logado (nome, avatar, perfil) | Usa o payload do JWT (`sub`, `role`) + endpoints de perfil |
| `GET /api/proposals/mine` | Listar as propostas enviadas pelo prestador com status | `/prestador/propostas` reconstrói a partir das solicitações acessíveis; lista incompleta |
| `GET /api/orders/mine` | Listar pedidos do usuário (prestador e contratante) | `/prestador/servicos` deriva dos dados disponíveis; ideal é a rota dedicada |
| `GET /api/admin/providers` | Lista completa de prestadores com categoria, cidade, avaliação, conta de pagamento e data de cadastro | `/admin/prestadores` usa `GET /api/admin/providers/pending` + `GET /api/admin/users?role=PRESTADOR` |
| `GET /api/admin/companies` | Lista de empresas com CNPJ, cidade, segmento e serviços publicados | `/admin/empresas` usa `GET /api/admin/users?role=EMPRESA` |

### Implementado nesta rodada

* **`POST /api/auth/reset-password`** — rota registrada no backend, com tabela própria (`password_reset_tokens`), expiração de 1 hora, uso único e revogação de todas as sessões ativas ao trocar a senha. `requestPasswordReset` agora envia email de verdade via SMTP (ou imprime no console se `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` não estiverem configurados — modo dev).
* **`POST /api/uploads`** — recebe um arquivo (`multipart/form-data`, campo `file`; JPG/PNG/WEBP/PDF até 5MB) autenticado, salva em `UPLOAD_DIR` e devolve `{ url }`. Os arquivos ficam servidos publicamente em `/uploads/<nome>`. Use `uploadsService.uploadFile(file)` (novo, em `src/services/uploads.service.ts`) para trocar os campos de URL manual por upload real — os componentes de tela ainda precisam ser ajustados um a um para usar `<input type="file">` no lugar do campo de texto.

### Divergências entre o briefing e o backend

* **Conclusão do serviço:** o briefing previa o prestador marcando como concluído. No backend, `POST /api/orders/:id/complete` é restrito a **CLIENTE/EMPRESA** (é o contratante que confirma e libera o saldo). O frontend seguiu o backend: o botão de concluir aparece para quem contratou, e o prestador vê o estado na timeline.
* **Filtros de distância e disponibilidade na busca:** `GET /api/providers` aceita `categorySlug`, `city`, `minRating`, `maxPrice`, `page` e `pageSize`. Os dois filtros restantes não existem na API e por isso não foram criados na interface.
* **Raio de atendimento no cadastro:** o registro de prestador não aceita `serviceRadiusKm`; o campo é salvo logo em seguida por `PUT /api/providers/me/profile`.
* **Chat:** usa `GET/POST /api/messages/:serviceRequestId` com polling. A estrutura está isolada em um hook para trocar por WebSocket quando o backend oferecer.

---

## Observações de segurança

* Não são armazenados: senha, secret key, access token do gateway, refresh token do Mercado Pago ou credenciais administrativas.
* O access token existe apenas em memória durante a sessão.
* Erros da API nunca são exibidos crus: `getErrorMessage()` traduz para mensagens amigáveis, com skeleton, empty state, error state e botão "Tentar novamente" em todas as telas que buscam dados.
