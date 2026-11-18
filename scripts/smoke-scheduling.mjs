import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const db=new PrismaClient();
async function main(){
 const church=await db.church.findUniqueOrThrow({where:{slug:"lagoinha-alem-paraiba"}});
 const coordinator=await db.user.create({data:{
  name:"Coordenador Teste",email:"coord-"+randomUUID()+"@example.invalid",passwordHash:"smoke-only"
 }});
 await db.membership.create({data:{churchId:church.id,userId:coordinator.id,role:"COORDENADOR"}});
 const ministry=await db.ministry.create({data:{churchId:church.id,name:"Equipe "+randomUUID()}});
 const otherMinistry=await db.ministry.create({data:{churchId:church.id,name:"Equipe "+randomUUID()}});
 await db.ministryCoordinator.create({data:{churchId:church.id,ministryId:ministry.id,userId:coordinator.id}});
 assert.equal(await db.ministryCoordinator.count({where:{churchId:church.id,userId:coordinator.id,ministryId:ministry.id}}),1);
 assert.equal(await db.ministryCoordinator.count({where:{churchId:church.id,userId:coordinator.id,ministryId:otherMinistry.id}}),0);
 const p=await db.person.create({data:{churchId:church.id,fullName:"Voluntário de CI"}});
 const replacement=await db.person.create({data:{churchId:church.id,fullName:"Substituto de CI"}});
 await db.teamMember.createMany({data:[{churchId:church.id,ministryId:ministry.id,personId:p.id},{churchId:church.id,ministryId:ministry.id,personId:replacement.id}]});
 const start=new Date(Date.now()+86400000);
 const event=await db.serviceEvent.create({data:{
  churchId:church.id,ministryId:ministry.id,title:"Culto teste",startsAt:start,endsAt:new Date(start.getTime()+3600000)
 }});
 const assignment=await db.scheduleAssignment.create({data:{
  churchId:church.id,ministryId:ministry.id,eventId:event.id,personId:p.id
 }});
 const request=await db.swapRequest.create({data:{
  churchId:church.id,ministryId:ministry.id,assignmentId:assignment.id,requesterId:coordinator.id
 }});
 assert.equal(request.status,"PENDENTE");
 await assert.rejects(()=>db.swapRequest.create({data:{
  churchId:church.id,ministryId:ministry.id,assignmentId:assignment.id,requesterId:coordinator.id
 }}),"Duas solicitações pendentes para a mesma escala devem ser bloqueadas.");
 await db.swapRequest.update({where:{id:request.id},data:{status:"CANCELADA",resolvedAt:new Date()}});
 const reopened=await db.swapRequest.create({data:{
  churchId:church.id,ministryId:ministry.id,assignmentId:assignment.id,requesterId:coordinator.id
 }});
 assert.equal(reopened.status,"PENDENTE");
 const otherChurch=await db.church.create({data:{slug:"ci-"+randomUUID(),name:"Outra Igreja Teste"}});
 await assert.rejects(()=>db.teamMember.create({data:{
  churchId:otherChurch.id,ministryId:ministry.id,personId:p.id
 }}),"FK composta deve impedir referências entre igrejas.");
 console.log("Smoke de coordenação, escala, troca e isolamento por igreja aprovado.");
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>db.$disconnect());
