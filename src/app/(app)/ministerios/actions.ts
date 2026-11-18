"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, requireAccess } from "@/lib/auth";
export async function createMinistry(data: FormData) {
  const { supabase, churchId, role } = await requireAccess();
  if (!canManage(role)) redirect("/ministerios?error=permissao");
  const name = String(data.get("name") ?? "").trim();
  const description = String(data.get("description") ?? "").trim() || null;
  if (name.length < 2 || name.length > 100 || (description && description.length > 500)) redirect("/ministerios?error=validacao");
  const { error } = await supabase.from("ministries").insert({ church_id: churchId, name, description });
  if (error) redirect("/ministerios?error=salvar");
  revalidatePath("/ministerios"); revalidatePath("/dashboard"); redirect("/ministerios?success=1");
}
