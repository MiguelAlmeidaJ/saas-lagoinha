"use server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { clearLoginFailures,hashResetToken,validResetToken } from "@/lib/account-security";
export type ResetState={error:string;success:boolean};
const failure=(error:string):ResetState=>({error,success:false});
export async function completePasswordReset(_previous:ResetState,form:FormData):Promise<ResetState>{
 const token=String(form.get("token")??"");
 const password=String(form.get("password")??"");
 const confirmation=String(form.get("confirmation")??"");
 if(!validResetToken(token)) return failure("Link inválido.");
 if(password.length<12||password.length>128||password!==confirmation) return failure("Use uma senha de 12 a 128 caracteres, igual à confirmação.");
 const passwordHash=await hash(password,12);
 let email="";
 try{
  await prisma.$transaction(async tx=>{
   const reset=await tx.passwordReset.findUnique({where:{tokenHash:hashResetToken(token)},
    include:{user:{select:{active:true,email:true,memberships:{select:{churchId:true}}}}}
   });
   if(!reset||reset.usedAt||reset.revokedAt||reset.expiresAt<=new Date()||!reset.user.active||
      !reset.user.memberships.some(m=>m.churchId===reset.churchId)) throw new Error("invalid");
   const claimed=await tx.passwordReset.updateMany({
    where:{id:reset.id,usedAt:null,revokedAt:null,expiresAt:{gt:new Date()}},data:{usedAt:new Date()}
   });
   if(claimed.count!==1) throw new Error("invalid");
   await tx.user.update({where:{id:reset.userId},data:{passwordHash}});
   await tx.session.deleteMany({where:{userId:reset.userId}});
   await tx.passwordReset.updateMany({where:{userId:reset.userId,usedAt:null,revokedAt:null},
    data:{revokedAt:new Date()}});
   await tx.auditLog.create({data:{
    churchId:reset.churchId,actorId:reset.userId,entityType:"PasswordReset",entityId:reset.id,operation:"COMPLETE"
   }});
   email=reset.user.email;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 }catch(e){
  if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2034") return failure("Tente novamente.");
  return failure("O link expirou, foi revogado ou já foi usado. Peça outro à administração.");
 }
 if(email) await clearLoginFailures(email);
 return {error:"",success:true};
}
