# ConectaServiços — execução local

## 1. Requisitos
- Node.js LTS
- VS Code
- PostgreSQL **ou Docker Desktop**

## 2. Primeira execução (recomendado: Docker)
Na pasta raiz do projeto:

```powershell
docker compose up -d
```

Isso cria automaticamente o PostgreSQL com:
- banco: `conectaservicos`
- usuário: `conectaservicos`
- senha: `conectaservicos`
- porta: `5432`

Se você já possui PostgreSQL instalado, não precisa usar Docker; apenas ajuste `DATABASE_URL` no `backend/.env`.

## 3. Instalar dependências

```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run seed

cd ..\conectaservicos-frontend
npm install
```

## 4. Iniciar

Pelo VS Code: `Terminal > Run Task... > 🚀 ConectaServiços: Iniciar Sistema`.

Ou em dois terminais:

```powershell
# terminal 1
cd backend
npm run dev
```

```powershell
# terminal 2
cd conectaservicos-frontend
npm run dev
```

Acesse `http://localhost:5173`.

## 5. Verificar a API
Abra `http://localhost:4000/api/health`. O resultado esperado é:

```json
{ "status": "ok" }
```

## 6. Usuário de teste
O seed cria dados de demonstração, incluindo o administrador definido no arquivo `backend/prisma/seed.ts`. **Consulte o seed para a senha antes de usar em produção.**

## Pagamentos
Mercado Pago/Stripe não são necessários para abrir o sistema e testar o restante. Para checkout real, preencha as credenciais de teste no `backend/.env`.
