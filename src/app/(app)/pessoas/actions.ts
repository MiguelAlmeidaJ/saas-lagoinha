"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, requireAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function createPerson(data: FormData) {
  const { churchId, role, user } = await requireAccess();
  if (!canManage(role)) redirect("/pessoas?error=permissao");
  const fullName = String(data.get("full_name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim() || null;
  const phone = String(data.get("phone") ?? "").trim() || null;
  if (fullName.length < 2 || fullName.length > 160 || (email && email.length > 254) || (phone && phone.length > 30)) redirect("/pessoas?error=validacao");
  await prisma.$transaction(async (tx) => {
    const person = await tx.person.create({data:{churchId,fullName,email,phone}});
    await tx.auditLog.create({data:{churchId,actorId:user.id,entityType:"Person",entityId:person.id,operation:"CREATE"}});
  });
  revalidatePath("/pessoas"); revalidatePath("/dashboard");
  redirect("/pessoas?success=1");
}
