import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { generalLimiter } from "./middlewares/rateLimit";
import { uploadsAbsoluteDir } from "./modules/uploads/uploads.config";

export const app = express();

// Necessário em produção: Render (e a maioria dos PaaS) coloca a aplicação
// atrás de um reverse proxy. Sem isso, o Express enxerga o IP do proxy em
// vez do IP real do cliente em TODAS as requisições — o que faz o
// express-rate-limit tratar todo mundo como um único usuário e bloquear a
// aplicação inteira assim que o limite é atingido por qualquer pessoa.
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    // origin dinâmica: permite qualquer domínio listado em FRONTEND_URL
    // (separado por vírgula), em vez de uma única string fixa — necessário
    // para liberar, por exemplo, produção + previews da Vercel ao mesmo tempo.
    origin(requestOrigin, callback) {
      // Requisições sem header Origin (ex.: curl, health checks) são permitidas.
      if (!requestOrigin) return callback(null, true);
      const normalized = requestOrigin.replace(/\/+$/, "");
      if (env.frontendUrls.includes(normalized)) {
        return callback(null, true);
      }
      return callback(new Error(`Origem não permitida pelo CORS: ${requestOrigin}`));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(generalLimiter);

// Serve os arquivos enviados via POST /api/uploads (avatar, fotos, documentos).
// O Helmet, por padrão, bloqueia o carregamento cross-origin desses arquivos
// (frontend e backend ficam em domínios diferentes em produção — ex.: Vercel + Render),
// então liberamos explicitamente o Cross-Origin-Resource-Policy só para esta rota estática.
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(uploadsAbsoluteDir)
);

// IMPORTANTE: o webhook de pagamentos precisa do corpo bruto (raw bytes) para
// validar a assinatura HMAC do gateway. Se o express.json() global consumir o
// corpo antes, a verificação de assinatura falha sempre. Por isso pulamos o
// parser JSON global exatamente nessa rota — o próprio módulo de pagamentos
// aplica express.raw() só para ela.
app.use((req, res, next) => {
  if (req.path === "/api/payments/webhook") return next();
  express.json({ limit: "5mb" })(req, res, next);
});
app.use((req, res, next) => {
  if (req.path === "/api/payments/webhook") return next();
  express.urlencoded({ extended: true })(req, res, next);
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);
