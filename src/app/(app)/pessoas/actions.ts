"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, requireAccess } from "@/lib/auth";
export async function createPerson(data: FormData) {
  const { supabase, churchId, role } = await requireAccess();
  if (!canManage(role)) redirect("/pessoas?error=permissao");
  const full_name = String(data.get("full_name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim() || null;
  const phone = String(data.get("phone") ?? "").trim() || null;
  if (full_name.length < 2 || full_name.length > 160 || (email && email.length > 254) || (phone && phone.length > 30)) redirect("/pessoas?error=validacao");
  const { error } = await supabase.from("people").insert({ church_id: churchId, full_name, email, phone });
  if (error) redirect("/pessoas?error=salvar");
  revalidatePath("/pessoas"); revalidatePath("/dashboard");
  redirect("/pessoas?success=1");
}
