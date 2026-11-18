"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/auth";
import { canSchedule, parseChurchDate } from "@/lib/scheduling";
import { Prisma, type AssignmentStatus } from "@prisma/client";

function validId(value: string) { return /^[a-f0-9-]{36}$/i.test(value); }
function fail(reason: string): never { redirect("/escalas?error=" + encodeURIComponent(reason)); }
async function manager() {
  const access = await requireAccess();
  if (!canSchedule(access.role)) fail("permissao");
  return access;
}
async function audit(tx: Prisma.TransactionClient, churchId: string, actorId: string, entityType: string, entityId: string, operation: string) {
  await tx.auditLog.create({data:{churchId,actorId,entityType,entityId,operation}});
}

export async function addFunction(form: FormData) {
 const {churchId,user}=await manager();
 const ministryId=String(form.get("ministryId")??"");
 const name=String(form.get("name")??"").trim();
 if(!validId(ministryId)||name.length<2||name.length>100) fail("validacao");
 const ministry=await prisma.ministry.findFirst({where:{id:ministryId,churchId}});
 if(!ministry) fail("ministerio");
 try {
 await prisma.$transaction(async tx=>{
  const record=await tx.ministryFunction.create({data:{churchId,ministryId,name}});
  await audit(tx,churchId,user.id,"MinistryFunction",record.id,"CREATE");
 });
 }catch {fail("duplicado");}
 revalidatePath("/escalas"); redirect("/escalas?success=funcao");
}

export async function addTeamMember(form: FormData) {
 const {churchId,user}=await manager();
 const ministryId=String(form.get("ministryId")??"");
 const personId=String(form.get("personId")??"");
 if(!validId(ministryId)||!validId(personId)) fail("validacao");
 const [ministry,person]=await Promise.all([
   prisma.ministry.findFirst({where:{id:ministryId,churchId}}),
   prisma.person.findFirst({where:{id:personId,churchId}})
 ]);
 if(!ministry||!person) fail("cadastro");
 await prisma.$transaction(async tx=>{
  const record=await tx.teamMember.upsert({
    where:{churchId_ministryId_personId:{churchId,ministryId,personId}},
    create:{churchId,ministryId,personId,active:true},update:{active:true}
  });
  await audit(tx,churchId,user.id,"TeamMember",record.id,"UPSERT");
 });
 revalidatePath("/escalas"); redirect("/escalas?success=equipe");
}

export async function addEvent(form: FormData) {
 const {churchId,user}=await manager();
 const ministryId=String(form.get("ministryId")??"");
 const title=String(form.get("title")??"").trim();
 const location=String(form.get("location")??"").trim()||null;
 const startsAt=parseChurchDate(String(form.get("startsAt")??""));
 const endsAt=parseChurchDate(String(form.get("endsAt")??""));
 if(!validId(ministryId)||title.length<2||title.length>160||(location&&location.length>160)||!startsAt||!endsAt||startsAt>=endsAt) fail("validacao");
 if(!await prisma.ministry.findFirst({where:{id:ministryId,churchId}})) fail("ministerio");
 await prisma.$transaction(async tx=>{
   const record=await tx.serviceEvent.create({data:{churchId,ministryId,title,location,startsAt,endsAt}});
   await audit(tx,churchId,user.id,"ServiceEvent",record.id,"CREATE");
 });
 revalidatePath("/escalas"); redirect("/escalas?success=evento");
}

export async function assignPerson(form: FormData) {
 const {churchId,user}=await manager();
 const eventId=String(form.get("eventId")??"");
 const personId=String(form.get("personId")??"");
 const functionId=String(form.get("functionId")??"")||null;
 if(!validId(eventId)||!validId(personId)||(functionId&&!validId(functionId))) fail("validacao");
 const event=await prisma.serviceEvent.findFirst({where:{id:eventId,churchId}});
 if(!event) fail("evento");
 const member=await prisma.teamMember.findFirst({
   where:{churchId,ministryId:event.ministryId,personId,active:true}
 });
 if(!member) fail("nao_equipe");
 if(functionId) {
   const fn=await prisma.ministryFunction.findFirst({where:{id:functionId,churchId,ministryId:event.ministryId}});
   if(!fn) fail("funcao");
 }
 const conflicting=await prisma.scheduleAssignment.findFirst({where:{
  churchId,personId,status:{not:"RECUSADA"},
  event:{startsAt:{lt:event.endsAt},endsAt:{gt:event.startsAt}}
 }});
 if(conflicting) fail("conflito_escala");
 const unavailable=await prisma.unavailability.findFirst({where:{
   churchId,personId,startsAt:{lt:event.endsAt},endsAt:{gt:event.startsAt}
 }});
 if(unavailable) fail("indisponivel");
 try {
 await prisma.$transaction(async tx=>{
   const record=await tx.scheduleAssignment.create({data:{churchId,ministryId:event.ministryId,eventId,personId,functionId}});
   await audit(tx,churchId,user.id,"ScheduleAssignment",record.id,"CREATE");
 });
 }catch {fail("duplicado");}
 revalidatePath("/escalas"); redirect("/escalas?success=escala");
}

export async function respondAssignment(form: FormData) {
 const {churchId,user,role}=await requireAccess();
 const assignmentId=String(form.get("assignmentId")??"");
 const decision=String(form.get("decision")??"");
 if(!validId(assignmentId)||!["CONFIRMADA","RECUSADA"].includes(decision)) fail("validacao");
 const target=await prisma.scheduleAssignment.findFirst({
  where:{id:assignmentId,churchId},include:{person:{select:{userId:true}}}
 });
 if(!target) fail("escala");
 if(target.person.userId!==user.id&&!canSchedule(role)) fail("permissao");
 await prisma.$transaction(async tx=>{
  const updated=await tx.scheduleAssignment.updateMany({
    where:{id:target.id,churchId,status:"PENDENTE"},
    data:{status:decision as AssignmentStatus,respondedAt:new Date()}
  });
  if(updated.count) await audit(tx,churchId,user.id,"ScheduleAssignment",target.id,decision);
 });
 revalidatePath("/escalas"); redirect("/escalas?success=resposta");
}

export async function addUnavailability(form: FormData) {
 const {churchId,user,role}=await requireAccess();
 const personId=String(form.get("personId")??"");
 const startsAt=parseChurchDate(String(form.get("startsAt")??""));
 const endsAt=parseChurchDate(String(form.get("endsAt")??""));
 const reason=String(form.get("reason")??"").trim()||null;
 if(!validId(personId)||!startsAt||!endsAt||startsAt>=endsAt||(reason&&reason.length>250)) fail("validacao");
 const person=await prisma.person.findFirst({where:{id:personId,churchId}});
 if(!person||(person.userId!==user.id&&!canSchedule(role))) fail("permissao");
 await prisma.$transaction(async tx=>{
  const record=await tx.unavailability.create({data:{churchId,personId,startsAt,endsAt,reason}});
  await audit(tx,churchId,user.id,"Unavailability",record.id,"CREATE");
 });
 revalidatePath("/escalas"); redirect("/escalas?success=indisponibilidade");
}

export async function linkAccount(form: FormData) {
 const {churchId,user}=await manager();
 const personId=String(form.get("personId")??"");
 const email=String(form.get("email")??"").trim().toLowerCase();
 if(!validId(personId)||!email) fail("validacao");
 const [person,target]=await Promise.all([
  prisma.person.findFirst({where:{id:personId,churchId}}),
  prisma.user.findFirst({where:{email,memberships:{some:{churchId}}}})
 ]);
 if(!person||!target) fail("conta");
 try {
  await prisma.$transaction(async tx=>{
   await tx.person.update({where:{id:person.id},data:{userId:target.id}});
   await audit(tx,churchId,user.id,"Person",person.id,"LINK_USER");
  });
 }catch{fail("conta_vinculada");}
 revalidatePath("/escalas");redirect("/escalas?success=vinculo");
}

/** Cria até oito eventos semanais em uma única transação. */
export async function createRecurringEvents(form: FormData) {
 const {churchId,user}=await manager();
 const ministryId=String(form.get("ministryId")??"");
 const title=String(form.get("title")??"").trim();
 const location=String(form.get("location")??"").trim()||null;
 const startsAt=parseChurchDate(String(form.get("startsAt")??""));
 const endsAt=parseChurchDate(String(form.get("endsAt")??""));
 const count=Number(form.get("count"));
 if(!validId(ministryId)||title.length<2||title.length>160||(location&&location.length>160)||
    !startsAt||!endsAt||endsAt<=startsAt||!Number.isInteger(count)||count<2||count>8) fail("validacao");
 if(!await prisma.ministry.findFirst({where:{churchId,id:ministryId}})) fail("ministerio");
 const WEEK=7*24*60*60*1000;
 await prisma.$transaction(async tx=>{
  for(let i=0;i<count;i++){
   const event=await tx.serviceEvent.create({data:{
    churchId,ministryId,title,location,
    startsAt:new Date(startsAt.getTime()+WEEK*i),
    endsAt:new Date(endsAt.getTime()+WEEK*i)
   }});
   await audit(tx,churchId,user.id,"ServiceEvent",event.id,"CREATE_RECURRING");
  }
 });
 revalidatePath("/escalas");redirect("/escalas?success=recorrencia");
}

/** Substituição administrativa. Mantém o histórico do evento em audit_log. */
export async function replaceVolunteer(form: FormData) {
 const {churchId,user}=await manager();
 const assignmentId=String(form.get("assignmentId")??"");
 const newPersonId=String(form.get("personId")??"");
 if(!validId(assignmentId)||!validId(newPersonId)) fail("validacao");
 try {
  await prisma.$transaction(async tx=>{
   const original=await tx.scheduleAssignment.findFirst({
    where:{id:assignmentId,churchId},include:{event:true}
   });
   if(!original) throw new Error("escala");
   if(original.personId===newPersonId) throw new Error("mesma_pessoa");
   const team=await tx.teamMember.findFirst({where:{
    churchId,ministryId:original.ministryId,personId:newPersonId,active:true
   }});
   if(!team) throw new Error("nao_equipe");
   const conflicting=await tx.scheduleAssignment.findFirst({where:{
    churchId,personId:newPersonId,status:{not:"RECUSADA"},
    event:{startsAt:{lt:original.event.endsAt},endsAt:{gt:original.event.startsAt}}
   }});
   const unavailable=await tx.unavailability.findFirst({where:{
    churchId,personId:newPersonId,startsAt:{lt:original.event.endsAt},endsAt:{gt:original.event.startsAt}
   }});
   if(conflicting||unavailable) throw new Error("conflito");
   await tx.scheduleAssignment.update({
    where:{id:original.id},data:{personId:newPersonId,status:"PENDENTE",respondedAt:null}
   });
   await audit(tx,churchId,user.id,"ScheduleAssignment",original.id,
    "REPLACE:"+original.personId+"->"+newPersonId);
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 }catch(e){
  const reason=e instanceof Error&&["escala","mesma_pessoa","nao_equipe","conflito"].includes(e.message)?e.message:"substituicao";
  fail(reason);
 }
 revalidatePath("/escalas");redirect("/escalas?success=substituicao");
}
