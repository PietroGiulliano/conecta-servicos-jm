import nodemailer from "nodemailer";
import { env } from "../config/env";

let transporter: nodemailer.Transporter | null = null;
let warnedMissingConfig = false;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    if (!warnedMissingConfig) {
      console.warn(
        "[mailer] SMTP não configurado (SMTP_HOST/SMTP_USER/SMTP_PASS). " +
          "Emails serão apenas impressos no console. Configure as variáveis antes de produção."
      );
      warnedMissingConfig = true;
    }
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }

  return transporter;
}

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Envia um email transacional. Se o SMTP não estiver configurado (ex.: ambiente
 * de desenvolvimento sem credenciais), apenas registra o conteúdo no console
 * para não travar o fluxo — mas NUNCA lança erro para o chamador, já que o
 * fluxo de reset de senha não deve revelar falhas de envio ao usuário.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const client = getTransporter();

  if (!client) {
    console.log(`[dev] Email para ${input.to} — assunto: "${input.subject}"\n${input.text}`);
    return;
  }

  try {
    await client.sendMail({
      from: env.smtp.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  } catch (err) {
    // Não propaga o erro: falha de envio de email não pode derrubar a requisição
    // nem revelar ao usuário se o email existe na base.
    console.error("[mailer] Falha ao enviar email:", err);
  }
}

export function buildPasswordResetEmail(resetUrl: string) {
  return {
    subject: "Redefinição de senha — ConectaServiços",
    text: `Você solicitou a redefinição da sua senha. Acesse o link para continuar (válido por 1 hora): ${resetUrl}\n\nSe você não solicitou isso, ignore este email.`,
    html: `
      <p>Você solicitou a redefinição da sua senha no ConectaServiços.</p>
      <p><a href="${resetUrl}">Clique aqui para criar uma nova senha</a> (link válido por 1 hora).</p>
      <p>Se você não solicitou isso, ignore este email — sua senha atual continua válida.</p>
    `,
  };
}
