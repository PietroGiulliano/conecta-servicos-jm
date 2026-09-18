import { prisma } from "../../config/prisma";
import { env } from "../../config/env";

const COMMISSION_KEY = "commission_percent";

// A comissão é lida no momento da criação do pedido e gravada de forma imutável
// em Order.commissionRate — alterá-la aqui NUNCA afeta pedidos já criados.
export async function getCurrentCommissionPercent(): Promise<number> {
  const setting = await prisma.platformSetting.findUnique({ where: { key: COMMISSION_KEY } });
  if (!setting) return env.defaultCommissionPercent;
  const value = setting.value as { percent: number };
  return value.percent;
}

export async function setCommissionPercent(percent: number): Promise<number> {
  if (percent < 0 || percent > 100) {
    throw new Error("Percentual de comissão inválido.");
  }
  await prisma.platformSetting.upsert({
    where: { key: COMMISSION_KEY },
    create: { key: COMMISSION_KEY, value: { percent } },
    update: { value: { percent } },
  });
  return percent;
}
