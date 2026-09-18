import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const CATEGORY_NAMES = [
  "Eletricista",
  "Encanador",
  "Pedreiro",
  "Pintor",
  "Mecânico",
  "Técnico de Informática",
  "Diarista",
  "Fotógrafo",
  "Designer",
  "Jardinagem",
];

const CITIES = ["João Monlevade", "Itabira", "Belo Horizonte", "Coronel Fabriciano", "Ipatinga"];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("Seeding — nenhum dado real é utilizado, apenas fictício para desenvolvimento.");

  // Senha só para os 30 usuários fictícios de demonstração (clientes/prestadores de teste).
  const passwordHash = await argon2.hash("Senha123!", { type: argon2.argon2id });
  // Senha forte e exclusiva do admin — não reaproveita a senha fraca dos dados fictícios.
  const adminPasswordHash = await argon2.hash("qd0hoia02f92n5*3Z", { type: argon2.argon2id });

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@conectaservicos.com.br" },
    create: {
      name: "Administrador ConectaServiços",
      email: "admin@conectaservicos.com.br",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
    update: {},
  });

  await prisma.platformSetting.upsert({
    where: { key: "commission_percent" },
    create: { key: "commission_percent", value: { percent: 10 } },
    update: {},
  });

  // Categorias
  const categories = [];
  for (const name of CATEGORY_NAMES) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(name) },
      create: { name, slug: slugify(name) },
      update: {},
    });
    categories.push(category);
  }

  // 20 clientes
  const customers = [];
  for (let i = 1; i <= 20; i++) {
    const email = `cliente${i}@exemplo.com`;
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        name: `Cliente Teste ${i}`,
        email,
        phone: `31999${String(100000 + i).slice(-6)}`,
        passwordHash,
        role: "CLIENTE",
        customerProfile: { create: { city: CITIES[i % CITIES.length] } },
        addresses: {
          create: {
            label: "principal",
            street: `Rua Fictícia ${i}`,
            number: String(i * 10),
            district: "Centro",
            city: CITIES[i % CITIES.length],
            state: "MG",
            zipCode: "35930-000",
          },
        },
      },
      update: {},
      include: { customerProfile: true },
    });
    customers.push(user);
  }

  // 10 prestadores
  const providers = [];
  for (let i = 1; i <= 10; i++) {
    const email = `prestador${i}@exemplo.com`;
    const category = categories[i % categories.length];
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        name: `Prestador Teste ${i}`,
        email,
        phone: `31988${String(200000 + i).slice(-6)}`,
        passwordHash,
        role: "PRESTADOR",
        providerProfile: {
          create: {
            professionalName: `${category.name} ${i}`,
            documentNumber: `000.000.00${i}-0${i}`,
            categoryId: category.id,
            specialties: [category.name],
            citiesServed: [CITIES[i % CITIES.length], CITIES[(i + 1) % CITIES.length]],
            serviceRadiusKm: 15,
            startingPrice: 80 + i * 10,
            bio: `Profissional de ${category.name.toLowerCase()} com experiência em atendimentos residenciais e comerciais (dados fictícios para testes).`,
            approvalStatus: "APROVADO",
            ratingAverage: 4 + (i % 2) * 0.5,
            ratingCount: 10 + i,
            wallet: { create: {} },
          },
        },
      },
      update: {},
      include: { providerProfile: true },
    });
    providers.push(user);
  }

  // 30 solicitações de serviço + propostas + pedidos + pagamentos + avaliações fictícias
  for (let i = 1; i <= 30; i++) {
    const customer = customers[i % customers.length];
    const providerUser = providers[i % providers.length];
    const category = categories[i % categories.length];

    const customerProfile = await prisma.customerProfile.findUnique({ where: { userId: customer.id } });
    const providerProfile = await prisma.providerProfile.findUnique({ where: { userId: providerUser.id } });
    if (!customerProfile || !providerProfile) continue;

    const request = await prisma.serviceRequest.create({
      data: {
        customerId: customerProfile.id,
        categoryId: category.id,
        title: `Serviço de ${category.name.toLowerCase()} #${i}`,
        description: "Descrição fictícia gerada pelo seed para ambiente de desenvolvimento.",
        photos: [],
        city: CITIES[i % CITIES.length],
        status: i % 3 === 0 ? "SOLICITADO" : "CONCLUIDO",
        statusHistory: { create: { status: "SOLICITADO" } },
      },
    });

    const proposal = await prisma.proposal.create({
      data: {
        serviceRequestId: request.id,
        providerId: providerProfile.id,
        value: 100 + i * 5,
        description: "Proposta fictícia de teste.",
        status: i % 3 === 0 ? "ENVIADA" : "ACEITA",
      },
    });

    if (i % 3 !== 0) {
      const gross = Number(proposal.value);
      const commissionAmount = Math.round(gross * 0.1 * 100) / 100;
      const providerAmount = Math.round((gross - commissionAmount) * 100) / 100;

      const order = await prisma.order.create({
        data: {
          serviceRequestId: request.id,
          proposalId: proposal.id,
          customerId: customerProfile.id,
          providerId: providerProfile.id,
          grossAmount: gross,
          commissionRate: 10,
          commissionAmount,
          providerAmount,
        },
      });

      await prisma.payment.create({
        data: {
          orderId: order.id,
          gateway: "MERCADO_PAGO",
          method: i % 2 === 0 ? "PIX" : "CARTAO_CREDITO",
          status: "APROVADO",
          grossAmount: gross,
          commissionAmount,
          providerNetAmount: providerAmount,
          idempotencyKey: `seed-${order.id}`,
          approvedAt: new Date(),
        },
      });

      await prisma.review.create({
        data: {
          orderId: order.id,
          customerId: customerProfile.id,
          providerId: providerProfile.id,
          rating: 4 + (i % 2),
          comment: "Avaliação fictícia de teste — ótimo atendimento.",
        },
      });
    }
  }

  console.log("Seed concluído. Todos os dados são fictícios (nunca use dados reais aqui).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
