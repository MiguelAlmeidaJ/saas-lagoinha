import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const church = await prisma.church.upsert({
    where: { slug: "lagoinha-alem-paraiba" },
    create: { name: "Lagoinha Além Paraíba", slug: "lagoinha-alem-paraiba" },
    update: {}
  });
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("Igreja criada. Para criar admin, defina ADMIN_EMAIL e ADMIN_PASSWORD e rode o seed novamente.");
    return;
  }
  if (password.length < 12) throw new Error("ADMIN_PASSWORD deve ter pelo menos 12 caracteres.");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("O usuário admin já existe. Seed não altera senha/permissões existentes.");
    return;
  }
  const user = await prisma.user.create({ data: { name: "Administrador", email, passwordHash: await hash(password, 12) } });
  await prisma.membership.create({ data: { churchId: church.id, userId: user.id, role: "ADMIN" } });
  console.log("Administrador inicial criado com sucesso.");
}
main().finally(() => prisma.$disconnect());
