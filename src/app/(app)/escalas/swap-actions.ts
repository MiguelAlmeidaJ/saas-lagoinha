"use server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageMinistry } from "@/lib/scheduling";

const uuid=(value:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const fail=(code:string):never=>redirect("/escalas?error="+encodeURIComponent(code));
const success=(code:string):never=>{revalidatePath("/escalas");redirect("/escalas?success="+code);};

export async function requestSwap(form:FormData) {
 const {churchId,user}=await requireAccess();
 const assignmentId=String(form.get("assignmentId")??"");
 const reason=String(form.get("reason")??"").trim();
 if(!uuid(assignmentId)||reason.length>500) fail("validacao");
 const assignment=await prisma.scheduleAssignment.findFirst({
  where:{churchId,id:assignmentId},include:{person:{select:{userId:true}},event:{select:{startsAt:true}}}
 });
 if(!assignment||assignment.person.userId!==user.id||assignment.status==="RECUSADA") fail("permissao");
 if(assignment.event.startsAt<=new Date()) fail("evento_passado");
 try {
  await prisma.$transaction(async tx=>{
   const request=await tx.swapRequest.create({data:{
    churchId,ministryId:assignment.ministryId,assignmentId,requesterId:user.id,reason:reason||null
   }});
   await tx.auditLog.create({data:{churchId,actorId:user.id,entityType:"SwapRequest",entityId:request.id,operation:"REQUEST"}});
  });
 }catch{fail("solicitacao_ja_aberta");}
 success("troca_solicitada");
}

export async function cancelSwap(form:FormData) {
 const {churchId,user}=await requireAccess();
 const requestId=String(form.get("requestId")??"");
 if(!uuid(requestId)) fail("validacao");
 const request=await prisma.swapRequest.findFirst({where:{id:requestId,churchId,requesterId:user.id,status:"PENDENTE"}});
 if(!request) fail("solicitacao");
 await prisma.$transaction(async tx=>{
  const updated=await tx.swapRequest.updateMany({where:{id:request.id,churchId,status:"PENDENTE"},data:{status:"CANCELADA",resolvedAt:new Date()}});
  if(updated.count) await tx.auditLog.create({data:{churchId,actorId:user.id,entityType:"SwapRequest",entityId:request.id,operation:"CANCEL"}});
 });
 success("troca_cancelada");
}

export async function decideSwap(form:FormData) {
 const {churchId,user,role}=await requireAccess();
 const requestId=String(form.get("requestId")??"");
 const decision=String(form.get("decision")??"");
 const replacementId=String(form.get("replacementId")??"");
 if(!uuid(requestId)||!["APROVADA","RECUSADA"].includes(decision)||(decision==="APROVADA"&&!uuid(replacementId))) fail("validacao");
 const request=await prisma.swapRequest.findFirst({where:{id:requestId,churchId,status:"PENDENTE"}});
 if(!request) fail("solicitacao");
 if(!await canManageMinistry(churchId,user.id,role,request.ministryId)) fail("permissao");
 if(request.requesterId===user.id) fail("autoaprovacao");
 try {
  await prisma.$transaction(async tx=>{
   const active=await tx.swapRequest.findFirst({where:{id:request.id,churchId,status:"PENDENTE"}});
   if(!active) throw new Error("solicitacao");
   const original=await tx.scheduleAssignment.findFirst({
    where:{id:active.assignmentId,churchId},
    include:{event:true,person:{select:{userId:true}}}
   });
   if(!original||original.person.userId!==active.requesterId||original.ministryId!==active.ministryId) throw new Error("escala_alterada");
   if(original.event.startsAt<=new Date()) throw new Error("evento_passado");
   if(decision==="APROVADA") {
    if(original.personId===replacementId) throw new Error("mesma_pessoa");
    const member=await tx.teamMember.findFirst({where:{
     churchId,ministryId:original.ministryId,personId:replacementId,active:true
    }});
    if(!member) throw new Error("nao_equipe");
    const conflicting=await tx.scheduleAssignment.findFirst({where:{
     churchId,personId:replacementId,status:{not:"RECUSADA"},
     event:{startsAt:{lt:original.event.endsAt},endsAt:{gt:original.event.startsAt}}
    }});
    const unavailable=await tx.unavailability.findFirst({where:{
     churchId,personId:replacementId,
     startsAt:{lt:original.event.endsAt},endsAt:{gt:original.event.startsAt}
    }});
    if(conflicting||unavailable) throw new Error("conflito");
    await tx.scheduleAssignment.update({where:{id:original.id},data:{
     personId:replacementId,status:"PENDENTE",respondedAt:null
    }});
    await tx.auditLog.create({data:{churchId,actorId:user.id,entityType:"ScheduleAssignment",entityId:original.id,operation:"SWAP:"+original.personId+"->"+replacementId}});
   }
   const updated=await tx.swapRequest.updateMany({where:{id:active.id,churchId,status:"PENDENTE"},data:{
    status:decision==="APROVADA"?"APROVADA":"RECUSADA",resolvedById:user.id,resolvedAt:new Date()
   }});
   if(updated.count!==1) throw new Error("solicitacao");
   await tx.auditLog.create({data:{churchId,actorId:user.id,entityType:"SwapRequest",entityId:active.id,operation:decision}});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 }catch(e){
  const error=e instanceof Error?e.message:"erro";
  fail(["solicitacao","escala_alterada","evento_passado","mesma_pessoa","nao_equipe","conflito"].includes(error)?error:"troca");
 }
 success(decision==="APROVADA"?"troca_aprovada":"troca_recusada");
}

export async function grantMinistryCoordinator(form:FormData) {
 const {churchId,user,role}=await requireAccess();
 if(role!=="ADMIN"&&role!=="PASTOR") fail("permissao");
 const ministryId=String(form.get("ministryId")??"");
 const email=String(form.get("email")??"").trim().toLowerCase();
 if(!uuid(ministryId)||email.length>254||!email) fail("validacao");
 const ministry=await prisma.ministry.findFirst({where:{id:ministryId,churchId}});
 const target=await prisma.user.findFirst({where:{email,active:true,memberships:{some:{churchId,role:"COORDENADOR"}}}});
 if(!ministry||!target) fail("coordenador_invalido");
 await prisma.$transaction(async tx=>{
  const added=await tx.ministryCoordinator.upsert({
   where:{churchId_ministryId_userId:{churchId,ministryId,userId:target.id}},
   create:{churchId,ministryId,userId:target.id},update:{}
  });
  await tx.auditLog.create({data:{churchId,actorId:user.id,entityType:"MinistryCoordinator",entityId:added.id,operation:"GRANT"}});
 });
 success("coordenador_vinculado");
}

export async function revokeMinistryCoordinator(form:FormData) {
 const {churchId,user,role}=await requireAccess();
 if(role!=="ADMIN"&&role!=="PASTOR") fail("permissao");
 const coordinatorId=String(form.get("coordinatorId")??"");
 if(!uuid(coordinatorId)) fail("validacao");
 await prisma.$transaction(async tx=>{
  const removed=await tx.ministryCoordinator.deleteMany({where:{id:coordinatorId,churchId}});
  if(removed.count) await tx.auditLog.create({data:{churchId,actorId:user.id,entityType:"MinistryCoordinator",entityId:coordinatorId,operation:"REVOKE"}});
 });
 success("coordenador_removido");
}
