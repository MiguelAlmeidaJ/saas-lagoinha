import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export type Role = "admin" | "pastor" | "financeiro" | "coordenador" | "lider_gc" | "voluntario" | "membro";
export async function requireAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("church_memberships")
    .select("church_id,role,churches(name)").eq("user_id", user.id).limit(1).maybeSingle();
  if (!membership) redirect("/sem-acesso");
  return { supabase, user, churchId: membership.church_id as string, role: membership.role as Role };
}
export function canManage(role: Role) { return role === "admin" || role === "pastor"; }
