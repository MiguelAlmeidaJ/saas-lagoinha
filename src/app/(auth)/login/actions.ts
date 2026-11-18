"use server";
import { compare } from "bcryptjs";
import { clearLoginFailures,isLoginLocked,recordLoginFailure } from "@/lib/account-security";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";
export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password || email.length>254 || password.length>128) redirect("/login?error=1");
  if(await isLoginLocked(email)) redirect("/login?error=1");
  const user = await prisma.user.findUnique({ where: { email }, include: { memberships: { take: 1 } } });
  if (!user?.active || !user.memberships.length || !(await compare(password, user.passwordHash))) {
    await recordLoginFailure(email);
    redirect("/login?error=1");
  }
  // Não permite autenticar a sexta tentativa dentro da janela.
  if(await isLoginLocked(email)) redirect("/login?error=1");
  await clearLoginFailures(email);
  await createSession(user.id);
  redirect("/dashboard");
}
export async function logout() { await destroySession(); redirect("/login"); }
