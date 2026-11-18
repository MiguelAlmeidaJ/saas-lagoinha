const assert = require("node:assert/strict");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
async function main() {
  const church = await prisma.church.findUnique({ where: { slug: "lagoinha-alem-paraiba" } });
  assert.ok(church, "A igreja inicial deveria existir");
  const user = await prisma.user.findUnique({ where: { email: "admin-ci@example.invalid" } });
  assert.ok(user, "O administrador inicial deveria existir");
  const membership = await prisma.membership.findUnique({
    where: { churchId_userId: { churchId: church.id, userId: user.id } },
  });
  assert.equal(membership?.role, "ADMIN", "O administrador deve ter perfil ADMIN");
  const person = await prisma.person.create({ data: { churchId: church.id, fullName: "Pessoa Teste" } });
  const ministry = await prisma.ministry.create({ data: { churchId: church.id, name: "Ministério Teste" } });
  assert.equal((await prisma.person.count({ where: { churchId: church.id } })), 1);
  assert.equal((await prisma.ministry.count({ where: { churchId: church.id } })), 1);
  await prisma.person.delete({ where: { id: person.id } });
  await prisma.ministry.delete({ where: { id: ministry.id } });
  console.log("Smoke test de PostgreSQL, migrações e seed concluído.");
}
main().catch((err) => { console.error(err); process.exitCode = 1; }).finally(() => prisma.$disconnect());
