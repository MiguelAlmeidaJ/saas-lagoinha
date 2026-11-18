import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { canManageMinistry, permittedMinistryIds } from "../src/lib/scheduling";

async function main() {
 const churchA=await prisma.church.findUniqueOrThrow({where:{slug:"lagoinha-alem-paraiba"}});
 const churchB=await prisma.church.create({data:{name:"Igreja Teste de Isolamento",slug:"auth-ci-"+randomUUID()}});
 const ministryA=await prisma.ministry.create({data:{churchId:churchA.id,name:"Equipe CI A "+randomUUID()}});
 const ministryB=await prisma.ministry.create({data:{churchId:churchA.id,name:"Equipe CI B "+randomUUID()}});
 const ministryOther=await prisma.ministry.create({data:{churchId:churchB.id,name:"Equipe CI Outro "+randomUUID()}});
 const user=await prisma.user.create({data:{name:"Coordenador CI",email:"coordenador-"+randomUUID()+"@example.invalid",passwordHash:"not-for-login"}});
 await prisma.membership.create({data:{churchId:churchA.id,userId:user.id,role:"COORDENADOR"}});
 await prisma.ministryCoordinator.create({data:{churchId:churchA.id,userId:user.id,ministryId:ministryA.id}});

 assert.equal(await canManageMinistry(churchA.id,user.id,"COORDENADOR",ministryA.id),true);
 assert.equal(await canManageMinistry(churchA.id,user.id,"COORDENADOR",ministryB.id),false);
 assert.equal(await canManageMinistry(churchB.id,user.id,"COORDENADOR",ministryOther.id),false);
 assert.deepEqual(await permittedMinistryIds(churchA.id,user.id,"COORDENADOR"),[ministryA.id]);
 assert.deepEqual(await permittedMinistryIds(churchB.id,user.id,"COORDENADOR"),[]);
 assert.equal(await canManageMinistry(churchA.id,user.id,"VOLUNTARIO",ministryA.id),false);
 assert.deepEqual(await permittedMinistryIds(churchA.id,user.id,"MEMBRO"),[]);
 assert.equal(await canManageMinistry(churchA.id,user.id,"ADMIN",ministryB.id),true);
 assert.equal(await canManageMinistry(churchA.id,user.id,"PASTOR",ministryB.id),true);

 // Revogar o papel de coordenador invalida vínculos antigos, mesmo que persistam.
 await prisma.membership.update({where:{churchId_userId:{churchId:churchA.id,userId:user.id}},data:{role:"MEMBRO"}});
 assert.equal(await canManageMinistry(churchA.id,user.id,"COORDENADOR",ministryA.id),false);
 assert.deepEqual(await permittedMinistryIds(churchA.id,user.id,"COORDENADOR"),[]);
 await prisma.membership.update({where:{churchId_userId:{churchId:churchA.id,userId:user.id}},data:{role:"COORDENADOR"}});
 await prisma.user.update({where:{id:user.id},data:{active:false}});
 assert.equal(await canManageMinistry(churchA.id,user.id,"COORDENADOR",ministryA.id),false);

 // O Postgres precisa impedir referências entre igrejas mesmo diante de erros de aplicação.
 const personB=await prisma.person.create({data:{churchId:churchB.id,fullName:"Pessoa B"}});
 await assert.rejects(()=>prisma.teamMember.create({data:{
   churchId:churchA.id,ministryId:ministryA.id,personId:personB.id
 }}));
 await assert.rejects(()=>prisma.ministryCoordinator.create({data:{
   churchId:churchB.id,ministryId:ministryA.id,userId:user.id
 }}));

 const own=await prisma.person.create({data:{churchId:churchA.id,fullName:"Pessoa A"}});
 const team=await prisma.teamMember.create({data:{churchId:churchA.id,ministryId:ministryA.id,personId:own.id}});
 assert.equal(await prisma.teamMember.count({where:{churchId:churchB.id,id:team.id}}),0);
 assert.equal(await prisma.teamMember.count({where:{churchId:churchA.id,id:team.id}}),1);
 console.log("Authorization and tenant isolation smoke tests passed.");
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
