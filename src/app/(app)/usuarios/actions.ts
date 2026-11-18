"use server";
import { Prisma, type Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInvitationToken, canInviteRole } from "@/lib/invitations";

export type InviteState={error:string;link:string;email:string};
const initialError=(message:string):InviteState=>({error:message,link:"",email:""});
const validUuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export async function createInvite(_previous:InviteState, form:FormData):Promise<InviteState> {
 const {churchId,user,role}=await requireAccess();
 if(role!=="ADMIN"&&role!=="PASTOR") return initialError("Você não tem permissão para convidar.");
 const personId=String(form.get("personId")??"");
 const email=String(form.get("email")??"").trim().toLowerCase();
 const invitedRole=String(form.get("role")??"") as Role;
 if(!validUuid(personId)||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||
    !canInviteRole(role,invitedRole)) return initialError("Confira pessoa, e-mail e perfil selecionados.");
 const person=await prisma.person.findFirst({where:{id:personId,churchId},select:{id:true,userId:true}});
 if(!person||person.userId) return initialError("Pessoa não encontrada ou já vinculada a uma conta.");
 if(await prisma.user.findUnique({where:{email},select:{id:true}})) {
  return initialError("Este e-mail já possui conta. O vínculo de contas existentes requer um fluxo separado.");
 }
 const count=await prisma.invitation.count({where:{churchId,createdById:user.id,createdAt:{gte:new Date(Date.now()-24*60*60*1000)}}});
 if(count>=30) return initialError("Limite diário de 30 convites por administrador atingido.");
 const {token,hash}=createInvitationToken();
 const expiresAt=new Date(Date.now()+48*60*60*1000);
 try {
  await prisma.$transaction(async tx=>{
   // Revoga o convite anterior da mesma pessoa antes de gerar outro.
   await tx.invitation.updateMany({where:{churchId,personId,usedAt:null,revokedAt:null},
     data:{revokedAt:new Date()}});
   const invitation=await tx.invitation.create({data:{
    churchId,personId,email,role:invitedRole,tokenHash:hash,expiresAt,createdById:user.id
   }});
   await tx.auditLog.create({data:{churchId,actorId:user.id,entityType:"Invitation",entityId:invitation.id,operation:"CREATE"}});
  });
 }catch {
  return initialError("Não foi possível criar o convite. Tente novamente.");
 }
 revalidatePath("/usuarios");
 // A URL absoluta é construída no navegador, a partir do caminho retornado aqui.
 // Não armazene nem registre o token em texto puro.
 return {error:"",link:"/ativar/"+token,email};
}

export async function revokeInvite(form:FormData) {
 const {churchId,user,role}=await requireAccess();
 if(role!=="ADMIN"&&role!=="PASTOR") redirect("/usuarios?error=permissao");
 const id=String(form.get("id")??"");
 if(!validUuid(id)) redirect("/usuarios?error=validacao");
 await prisma.$transaction(async tx=>{
  const changed=await tx.invitation.updateMany({where:{id,churchId,usedAt:null,revokedAt:null},
   data:{revokedAt:new Date()}});
  if(changed.count) await tx.auditLog.create({data:{churchId,actorId:user.id,entityType:"Invitation",entityId:id,operation:"REVOKE"}});
 });
 revalidatePath("/usuarios");
 redirect("/usuarios?success=revogado");
}
