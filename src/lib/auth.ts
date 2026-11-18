import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
const COOKIE = "lgap_session";
const SESSION_DAYS = 7;
const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await prisma.session.create({ data: { userId, tokenHash: digest(token), expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", expires: expiresAt
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: digest(token) } });
  jar.delete(COOKIE);
}

export async function getAccess() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: digest(token) },
    include: { user: { include: { memberships: { include: { church: true }, orderBy: { churchId: "asc" }, take: 1 } } } }
  });
  if (!session || session.expiresAt <= new Date() || !session.user.active) return null;
  const membership = session.user.memberships[0];
  if (!membership) return null;
  return { user: session.user, churchId: membership.churchId, church: membership.church, role: membership.role };
}

export async function requireAccess() {
  const access = await getAccess();
  if (!access) redirect("/login");
  return access;
}
export function canManage(role: Role) { return role === "ADMIN" || role === "PASTOR"; }
export function canViewPeople(role: Role) { return canManage(role) || role === "COORDENADOR"; }
