"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, requireAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function createMinistry(data: FormData) {
  const { churchId, role, user } = await requireAccess();
  if (!canManage(role)) redirect("/ministerios?error=permissao");
  const name = String(data.get("name") ?? "").trim();
  const description = String(data.get("description") ?? "").trim() || null;
  if (name.length < 2 || name.length > 100 || (description && description.length > 500)) redirect("/ministerios?error=validacao");
  await prisma.$transaction(async(tx)=>{
    const ministry = await tx.ministry.create({data:{churchId,name,description}});
    await tx.auditLog.create({data:{churchId,actorId:user.id,entityType:"Ministry",entityId:ministry.id,operation:"CREATE"}});
  });
  revalidatePath("/ministerios"); revalidatePath("/dashboard"); redirect("/ministerios?success=1");
}
