"use server";
import {Prisma,type GrowthAttendanceStatus} from "@prisma/client";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {requireAccess} from "@/lib/auth";
import {gcAdmin,canManageGroup} from "@/lib/growth-groups";
import {parseChurchDate} from "@/lib/scheduling";

const validId=(v:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
function fail(code:string):never{redirect("/gcs?error="+code);}
function done(code:string):never{revalidatePath("/gcs");revalidatePath("/dashboard");redirect("/gcs?success="+code);}
async function log(tx:Prisma.TransactionClient,churchId:string,actorId:string,type:string,id:string,operation:string){
 await tx.auditLog.create({data:{churchId,actorId,entityType:type,entityId:id,operation}});
}

export async function createGroup(form:FormData){
 const {churchId,user,role}=await requireAccess();
 if(!gcAdmin(role))fail("permissao");
 const name=String(form.get("name")??"").trim();
 const leaderId=String(form.get("leaderId")??"");
 const location=String(form.get("location")??"").trim()||null;
 const meetingDay=Number(form.get("meetingDay"));
 const meetingTime=String(form.get("meetingTime")??"");
 if(name.length<2||name.length>120||!validId(leaderId)||(location&&location.length>160)||
  !Number.isInteger(meetingDay)||meetingDay<0||meetingDay>6||
  !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(meetingTime))fail("validacao");
 const leader=await prisma.person.findFirst({where:{id:leaderId,churchId,
  user:{active:true,memberships:{some:{churchId,role:"LIDER_GC"}}}
 }});
 if(!leader)fail("lider");
 try{
  await prisma.$transaction(async tx=>{
   const group=await tx.growthGroup.create({data:{churchId,name,leaderId,location,meetingDay,meetingTime}});
   await log(tx,churchId,user.id,"GrowthGroup",group.id,"CREATE");
  });
 }catch{fail("duplicado");}
 done("grupo");
}

export async function addGroupMember(form:FormData){
 const {churchId,user,role}=await requireAccess();
 const groupId=String(form.get("groupId")??"");
 const personId=String(form.get("personId")??"");
 if(!validId(groupId)||!validId(personId))fail("validacao");
 if(!await canManageGroup(churchId,user.id,role,groupId))fail("permissao");
 const [group,person]=await Promise.all([
  prisma.growthGroup.findFirst({where:{churchId,id:groupId,active:true}}),
  prisma.person.findFirst({where:{churchId,id:personId}})
 ]);
 if(!group||!person)fail("cadastro");
 await prisma.$transaction(async tx=>{
  const member=await tx.growthGroupMember.upsert({
   where:{churchId_groupId_personId:{churchId,groupId,personId}},
   create:{churchId,groupId,personId},update:{active:true}
  });
  await log(tx,churchId,user.id,"GrowthGroupMember",member.id,"UPSERT");
 });
 done("participante");
}

export async function setGroupMemberActive(form:FormData){
 const {churchId,user,role}=await requireAccess();
 const memberId=String(form.get("memberId")??"");
 const active=String(form.get("active"))==="true";
 if(!validId(memberId))fail("validacao");
 const member=await prisma.growthGroupMember.findFirst({where:{churchId,id:memberId}});
 if(!member||!await canManageGroup(churchId,user.id,role,member.groupId))fail("permissao");
 await prisma.$transaction(async tx=>{
  await tx.growthGroupMember.update({where:{id:member.id},data:{active}});
  await log(tx,churchId,user.id,"GrowthGroupMember",member.id,active?"REACTIVATE":"DEACTIVATE");
 });
 done("participante");
}

export async function createMeeting(form:FormData){
 const {churchId,user,role}=await requireAccess();
 const groupId=String(form.get("groupId")??"");
 const startsAt=parseChurchDate(String(form.get("startsAt")??""));
 const theme=String(form.get("theme")??"").trim()||null;
 if(!validId(groupId)||!startsAt||(theme&&theme.length>160))fail("validacao");
 if(!await canManageGroup(churchId,user.id,role,groupId))fail("permissao");
 if(!await prisma.growthGroup.count({where:{id:groupId,churchId,active:true}}))fail("grupo_inativo");
 try{
  await prisma.$transaction(async tx=>{
   const meeting=await tx.growthMeeting.create({data:{churchId,groupId,startsAt,theme}});
   await log(tx,churchId,user.id,"GrowthMeeting",meeting.id,"CREATE");
  });
 }catch{fail("duplicado");}
 done("reuniao");
}

export async function markAttendance(form:FormData){
 const {churchId,user,role}=await requireAccess();
 const meetingId=String(form.get("meetingId")??"");
 const memberId=String(form.get("memberId")??"");
 const status=String(form.get("status")??"") as GrowthAttendanceStatus;
 if(!validId(meetingId)||!validId(memberId)||!["PRESENTE","AUSENTE","JUSTIFICADO"].includes(status))fail("validacao");
 const meeting=await prisma.growthMeeting.findFirst({where:{id:meetingId,churchId},select:{id:true,groupId:true}});
 if(!meeting||!await canManageGroup(churchId,user.id,role,meeting.groupId))fail("permissao");
 const member=await prisma.growthGroupMember.findFirst({
  where:{churchId,id:memberId,groupId:meeting.groupId,active:true}
 });
 if(!member)fail("participante");
 await prisma.$transaction(async tx=>{
  const attendance=await tx.growthAttendance.upsert({
   where:{churchId_meetingId_memberId:{churchId,meetingId,memberId}},
   create:{churchId,meetingId,memberId,status},update:{status,recordedAt:new Date()}
  });
  await log(tx,churchId,user.id,"GrowthAttendance",attendance.id,"UPSERT:"+status);
 });
 done("presenca");
}

export async function setGroupActive(form:FormData){
 const {churchId,user,role}=await requireAccess();
 if(!gcAdmin(role))fail("permissao");
 const groupId=String(form.get("groupId")??"");
 const active=String(form.get("active"))==="true";
 if(!validId(groupId))fail("validacao");
 const group=await prisma.growthGroup.findFirst({where:{churchId,id:groupId}});
 if(!group)fail("grupo");
 await prisma.$transaction(async tx=>{
  await tx.growthGroup.update({where:{id:group.id},data:{active}});
  await log(tx,churchId,user.id,"GrowthGroup",group.id,active?"REACTIVATE":"DEACTIVATE");
 });
 done("grupo");
}
