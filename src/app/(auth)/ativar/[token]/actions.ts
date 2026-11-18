"use server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashInvitationToken, isInvitationToken } from "@/lib/invitations";

export type ActivationState={error:string;success:boolean};
const invalid=(message:string):ActivationState=>({error:message,success:false});

export async function activateInvitation(_previous:ActivationState,form:FormData):Promise<ActivationState> {
 const token=String(form.get("token")??"");
 const password=String(form.get("password")??"");
 const passwordConfirmation=String(form.get("passwordConfirmation")??"");
 if(!isInvitationToken(token)) return invalid("Convite inválido.");
 if(password.length<12||password.length>128) return invalid("Use uma senha de 12 a 128 caracteres.");
 if(password!==passwordConfirmation) return invalid("As senhas não são iguais.");
 const tokenHash=hashInvitationToken(token);
 const passwordHash=await hash(password,12);
 try {
  await prisma.$transaction(async tx=>{
   const invitation=await tx.invitation.findUnique({where:{tokenHash},
     include:{person:{select:{id:true,userId:true,fullName:true}}}
   });
   if(!invitation||invitation.usedAt||invitation.revokedAt||invitation.expiresAt<=new Date()||
      invitation.person.userId) throw new Error("convite_invalido");
   // O token é consumido atomicamente: chamadas simultâneas não podem gerar duas contas.
   const claimed=await tx.invitation.updateMany({
    where:{id:invitation.id,usedAt:null,revokedAt:null,expiresAt:{gt:new Date()}},
    data:{usedAt:new Date()}
   });
   if(claimed.count!==1) throw new Error("convite_invalido");
   const user=await tx.user.create({data:{
    name:invitation.person.fullName,email:invitation.email,passwordHash,active:true
   }});
   await tx.membership.create({data:{churchId:invitation.churchId,userId:user.id,role:invitation.role}});
   const linked=await tx.person.updateMany({where:{id:invitation.personId,churchId:invitation.churchId,userId:null},
    data:{userId:user.id}});
   if(linked.count!==1) throw new Error("cadastro_vinculado");
   await tx.auditLog.create({data:{
    churchId:invitation.churchId,actorId:user.id,entityType:"Invitation",
    entityId:invitation.id,operation:"ACTIVATE"
   }});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  return {error:"",success:true};
 }catch(e){
  if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2002") {
   return invalid("Esse e-mail já possui uma conta. Procure o administrador.");
  }
  return invalid("Não foi possível ativar o convite. Ele pode estar expirado, revogado ou já utilizado.");
 }
}
