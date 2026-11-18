"use server";
import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clearLoginFailures } from "@/lib/account-security";

function fail(reason:string):never {redirect("/meu-perfil?error="+reason);}
function done(reason:string):never {revalidatePath("/meu-perfil");redirect("/meu-perfil?success="+reason);}

export async function updateMyProfile(form:FormData){
 const {churchId,user}=await requireAccess();
 const name=String(form.get("name")??"").trim().replace(/\s+/g," ");
 const phone=String(form.get("phone")??"").trim();
 if(name.length<2||name.length>160||phone.length>30) fail("validacao");
 await prisma.$transaction(async tx=>{
  await tx.user.update({where:{id:user.id},data:{name}});
  const person=await tx.person.findFirst({where:{churchId,userId:user.id},select:{id:true}});
  if(person) await tx.person.update({where:{id:person.id},data:{fullName:name,phone:phone||null}});
  await tx.auditLog.create({data:{churchId,actorId:user.id,entityType:"User",entityId:user.id,operation:"UPDATE_PROFILE"}});
 });
 revalidatePath("/minhas-escalas");
 done("perfil");
}

export async function changeMyPassword(form:FormData){
 const {churchId,user}=await requireAccess();
 const current=String(form.get("currentPassword")??"");
 const next=String(form.get("newPassword")??"");
 const confirmation=String(form.get("confirmation")??"");
 if(next.length<12||next.length>128||next!==confirmation) fail("senha_invalida");
 const fresh=await prisma.user.findUnique({where:{id:user.id},select:{passwordHash:true}});
 if(!fresh||!await compare(current,fresh.passwordHash)) fail("senha_atual");
 const passwordHash=await hash(next,12);
 await prisma.$transaction(async tx=>{
  await tx.user.update({where:{id:user.id},data:{passwordHash}});
  await tx.session.deleteMany({where:{userId:user.id}});
  await tx.auditLog.create({data:{churchId,actorId:user.id,entityType:"User",entityId:user.id,operation:"CHANGE_PASSWORD"}});
 });
 await clearLoginFailures(user.email);
 // Todas as sessões são invalidadas, inclusive a atual.
 redirect("/login?senha=alterada");
}
