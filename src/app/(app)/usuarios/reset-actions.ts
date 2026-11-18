"use server";
import { revalidatePath } from "next/cache";
import { requireAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeResetToken } from "@/lib/account-security";

export type ResetLinkState={error:string;link:string;email:string};
export const emptyResetLinkState:ResetLinkState={error:"",link:"",email:""};
const error=(message:string):ResetLinkState=>({error:message,link:"",email:""});
const validUuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export async function generatePasswordReset(_state:ResetLinkState,form:FormData):Promise<ResetLinkState>{
 const {churchId,user,role}=await requireAccess();
 if(role!=="ADMIN"&&role!=="PASTOR") return error("Sem permissão.");
 const userId=String(form.get("userId")??"");
 if(!validUuid(userId)) return error("Usuário inválido.");
 const target=await prisma.membership.findUnique({
  where:{churchId_userId:{churchId,userId}},include:{user:{select:{active:true,email:true}}}
 });
 if(!target||!target.user.active) return error("A conta não está ativa nesta igreja.");
 if(role==="PASTOR"&&!["MEMBRO","VOLUNTARIO","COORDENADOR","LIDER_GC"].includes(target.role)) return error("Perfil restrito.");
 const attempts=await prisma.passwordReset.count({where:{
  churchId,createdById:user.id,createdAt:{gte:new Date(Date.now()-86400000)}
 }});
 if(attempts>=20) return error("Limite de emissões diárias atingido.");
 const {token,tokenHash}=makeResetToken();
 try{
  await prisma.$transaction(async tx=>{
   await tx.passwordReset.updateMany({where:{churchId,userId,usedAt:null,revokedAt:null},data:{revokedAt:new Date()}});
   const reset=await tx.passwordReset.create({data:{
    churchId,userId,createdById:user.id,tokenHash,expiresAt:new Date(Date.now()+30*60000)
   }});
   await tx.auditLog.create({data:{
    churchId,actorId:user.id,entityType:"PasswordReset",entityId:reset.id,operation:"ISSUE"
   }});
  });
 }catch{return error("Não foi possível emitir o link. Tente novamente.");}
 revalidatePath("/usuarios");
 return {error:"",link:"/redefinir-senha/"+token,email:target.user.email};
}
