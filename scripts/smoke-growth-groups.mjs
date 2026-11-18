import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {PrismaClient} from "@prisma/client";
const db=new PrismaClient();
async function main(){
 const church=await db.church.findUniqueOrThrow({where:{slug:"lagoinha-alem-paraiba"}});
 const another=await db.church.create({data:{name:"GC CI Outra Igreja",slug:"gc-ci-"+randomUUID()}});
 const leader=await db.person.create({data:{churchId:church.id,fullName:"Líder CI"}});
 const attendee=await db.person.create({data:{churchId:church.id,fullName:"Participante CI"}});
 const foreign=await db.person.create({data:{churchId:another.id,fullName:"Pessoa de outra igreja"}});
 const group=await db.growthGroup.create({data:{churchId:church.id,name:"GC CI "+randomUUID(),
  leaderId:leader.id,meetingDay:3,meetingTime:"19:30"}});
 assert.equal(group.active,true);
 const member=await db.growthGroupMember.create({data:{churchId:church.id,groupId:group.id,personId:attendee.id}});
 const start=new Date(Date.now()+86400000);
 const meeting=await db.growthMeeting.create({data:{churchId:church.id,groupId:group.id,startsAt:start,theme:"Encontro CI"}});
 const record=await db.growthAttendance.create({data:{churchId:church.id,meetingId:meeting.id,memberId:member.id,status:"PRESENTE"}});
 assert.equal(record.status,"PRESENTE");
 await db.growthAttendance.update({where:{churchId_meetingId_memberId:{
  churchId:church.id,meetingId:meeting.id,memberId:member.id
 }},data:{status:"JUSTIFICADO"}});
 assert.equal((await db.growthAttendance.findUniqueOrThrow({where:{id:record.id}})).status,"JUSTIFICADO");
 await assert.rejects(()=>db.growthGroupMember.create({data:{
  churchId:church.id,groupId:group.id,personId:foreign.id
 }}),"Membros entre igrejas devem ser bloqueados");
 await assert.rejects(()=>db.growthGroup.create({data:{
  churchId:another.id,name:"GC Externo "+randomUUID(),leaderId:leader.id,meetingDay:1,meetingTime:"20:00"
 }}),"Líder de outra igreja deve ser bloqueado");
 await assert.rejects(()=>db.growthMeeting.create({data:{
  churchId:another.id,groupId:group.id,startsAt:start
 }}),"Reunião entre igrejas deve ser bloqueada");
 assert.equal(await db.growthGroup.count({where:{churchId:another.id,id:group.id}}),0);
 assert.equal(await db.growthGroupMember.count({where:{churchId:another.id,id:member.id}}),0);
 console.log("GCs: grupos, participantes, encontros, presenças e isolamento aprovados.");
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>db.$disconnect());
