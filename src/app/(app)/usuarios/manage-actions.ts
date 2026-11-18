"use server";
import { type Role, Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const uuid=(v:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const roles:Role[]=["ADMIN","PASTOR","FINANCEIRO","COORDENADOR","LIDER_GC","VOLUNTARIO","MEMBRO"];
function fail(code:string):never { redirect("/usuarios?error="+code); }
function done(code:string):never { revalidatePath("/usuarios");redirect("/usuarios?success="+code); }
async function requireManager(){
 const access=await requireAccess();
 if(access.role!=="ADMIN"&&access.role!=="PASTOR") fail("permissao");
 return access;
}
function canEditTarget(actor:Role,target:Role,desired?:Role){
 if(actor==="ADMIN") return true;
 const safe:Role[]=["MEMBRO","VOLUNTARIO","LIDER_GC","COORDENADOR"];
 return safe.includes(target)&&(!desired||safe.includes(desired));
}
async function guardLastAdmin(tx:Prisma.TransactionClient,churchId:string,targetRole:Role){
 if(targetRole!=="ADMIN") return;
 const count=await tx.membership.count({where:{churchId,role:"ADMIN",user:{active:true}}});
 if(count<=1) throw new Error("ultimo_admin");
}

export async function changeUserRole(form:FormData){
 const {churchId,user,role}=await requireManager();
 const targetUserId=String(form.get("userId")??"");
 const newRole=String(form.get("role")??"") as Role;
 if(!uuid(targetUserId)||!roles.includes(newRole)) fail("validacao");
 if(targetUserId===user.id) fail("proprio_perfil");
 try{
  await prisma.$transaction(async tx=>{
   const current=await tx.membership.findUnique({
    where:{churchId_userId:{churchId,userId:targetUserId}},
    include:{user:{select:{active:true}}}
   });
   if(!current||!canEditTarget(role,current.role,newRole)) throw new Error("permissao");
   if(!current.user.active) throw new Error("inativo");
   if(current.role===newRole) return;
   await guardLastAdmin(tx,churchId,current.role);
   await tx.membership.update({
    where:{churchId_userId:{churchId,userId:targetUserId}},
    data:{role:newRole}
   });
   if(current.role==="COORDENADOR"&&newRole!=="COORDENADOR") {
    await tx.ministryCoordinator.deleteMany({where:{churchId,userId:targetUserId}});
   }
   // Mudanças de perfil derrubam sessões ativas.
   await tx.session.deleteMany({where:{userId:targetUserId}});
   await tx.auditLog.create({data:{
    churchId,actorId:user.id,entityType:"User",entityId:targetUserId,
    operation:"ROLE:"+current.role+"->"+newRole
   }});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 }catch(e){
  const reason=e instanceof Error&&["ultimo_admin","permissao","inativo"].includes(e.message)?e.message:"alteracao";
  fail(reason);
 }
 done("perfil");
}

export async function setUserActive(form:FormData){
 const {churchId,user,role}=await requireManager();
 const targetUserId=String(form.get("userId")??"");
 const active=String(form.get("active")??"")==="true";
 if(!uuid(targetUserId)) fail("validacao");
 if(targetUserId===user.id) fail("propria_conta");
 try{
  await prisma.$transaction(async tx=>{
   const current=await tx.membership.findUnique({
    where:{churchId_userId:{churchId,userId:targetUserId}},
    include:{user:{select:{active:true,memberships:{select:{churchId:true}}}}}
   });
   if(!current||!canEditTarget(role,current.role)) throw new Error("permissao");
   // Por enquanto, a conta global só pode ser desativada quando pertence a uma igreja.
   if(current.user.memberships.length!==1) throw new Error("multi_igreja");
   if(current.user.active===active) return;
   if(!active) await guardLastAdmin(tx,churchId,current.role);
   await tx.user.update({where:{id:targetUserId},data:{active}});
   await tx.session.deleteMany({where:{userId:targetUserId}});
   await tx.auditLog.create({data:{
    churchId,actorId:user.id,entityType:"User",entityId:targetUserId,
    operation:active?"ACTIVATE":"DEACTIVATE"
   }});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 }catch(e){
  const reason=e instanceof Error&&["ultimo_admin","permissao","multi_igreja"].includes(e.message)?e.message:"alteracao";
  fail(reason);
 }
 done(active?"ativado":"desativado");
}
