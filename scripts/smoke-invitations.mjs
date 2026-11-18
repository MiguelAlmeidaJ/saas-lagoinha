import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();
const digest=t=>createHash("sha256").update(t).digest("hex");

async function main() {
 const church=await db.church.findUniqueOrThrow({where:{slug:"lagoinha-alem-paraiba"}});
 const admin=await db.user.findUniqueOrThrow({where:{email:"admin-ci@example.invalid"}});
 const person=await db.person.create({data:{churchId:church.id,fullName:"Pessoa Convite CI",email:"convite-"+randomUUID()+"@example.invalid"}});
 const token=randomBytes(32).toString("base64url");
 const record=await db.invitation.create({data:{
  churchId:church.id,personId:person.id,email:person.email,role:"VOLUNTARIO",
  tokenHash:digest(token),createdById:admin.id,expiresAt:new Date(Date.now()+3600000)
 }});
 assert.equal(await db.invitation.findUniqueOrThrow({where:{tokenHash:digest(token)}}).then(i=>i.id),record.id);
 await assert.rejects(()=>db.invitation.create({data:{
  churchId:church.id,personId:person.id,email:person.email,role:"VOLUNTARIO",
  tokenHash:digest(randomBytes(32).toString("base64url")),createdById:admin.id,
  expiresAt:new Date(Date.now()+3600000)
 }}),"Não podem existir dois convites abertos para a mesma pessoa.");
 const created=await db.$transaction(async tx=>{
  const updated=await tx.invitation.updateMany({where:{id:record.id,usedAt:null,revokedAt:null,expiresAt:{gt:new Date()}},data:{usedAt:new Date()}});
  assert.equal(updated.count,1);
  const user=await tx.user.create({data:{name:person.fullName,email:person.email,passwordHash:await bcrypt.hash("senha-para-teste-local",12)}});
  await tx.membership.create({data:{churchId:church.id,userId:user.id,role:"VOLUNTARIO"}});
  await tx.person.update({where:{id:person.id},data:{userId:user.id}});
  return user;
 });
 assert.equal(await db.invitation.updateMany({where:{id:record.id,usedAt:null},data:{usedAt:new Date()}}).then(x=>x.count),0);
 assert.equal((await db.person.findUniqueOrThrow({where:{id:person.id}})).userId,created.id);
 assert.equal((await db.membership.findUniqueOrThrow({where:{churchId_userId:{churchId:church.id,userId:created.id}}})).role,"VOLUNTARIO");
 console.log("Convites: índices, consumo único e vínculo da conta verificados.");
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>db.$disconnect());
