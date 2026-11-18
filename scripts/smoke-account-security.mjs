import assert from "node:assert/strict";
import { createHash,randomBytes,randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient();
const digest=s=>createHash("sha256").update(s).digest("hex");
async function main(){
 const church=await prisma.church.findUniqueOrThrow({where:{slug:"lagoinha-alem-paraiba"}});
 const admin=await prisma.user.findUniqueOrThrow({where:{email:"admin-ci@example.invalid"}});
 const emailHash=digest("login-security-"+randomUUID()+"@example.invalid");
 const throttle=await prisma.loginThrottle.create({data:{emailHash,failures:1}});
 assert.equal(throttle.failures,1);
 await prisma.loginThrottle.update({where:{emailHash},data:{failures:{increment:1},lockedUntil:new Date(Date.now()+900000)}});
 const checked=await prisma.loginThrottle.findUniqueOrThrow({where:{emailHash}});
 assert.equal(checked.failures,2);
 assert.ok(checked.lockedUntil>new Date());
 const token=randomBytes(32).toString("base64url");
 const reset=await prisma.passwordReset.create({data:{
  churchId:church.id,userId:admin.id,createdById:admin.id,tokenHash:digest(token),expiresAt:new Date(Date.now()+1800000)
 }});
 assert.equal((await prisma.passwordReset.findUniqueOrThrow({where:{tokenHash:digest(token)}})).id,reset.id);
 await assert.rejects(()=>prisma.passwordReset.create({data:{
  churchId:church.id,userId:admin.id,createdById:admin.id,
  tokenHash:digest(randomBytes(32).toString("base64url")),expiresAt:new Date(Date.now()+1800000)
 }}),"Não pode haver dois tokens de recuperação abertos.");
 const first=await prisma.passwordReset.updateMany({where:{id:reset.id,usedAt:null,revokedAt:null,expiresAt:{gt:new Date()}},data:{usedAt:new Date()}});
 const replay=await prisma.passwordReset.updateMany({where:{id:reset.id,usedAt:null,revokedAt:null},data:{usedAt:new Date()}});
 assert.equal(first.count,1);
 assert.equal(replay.count,0);
 await prisma.loginThrottle.delete({where:{emailHash}});
 console.log("Proteção de login e recuperação: persistência, exclusividade e uso único aprovados.");
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
