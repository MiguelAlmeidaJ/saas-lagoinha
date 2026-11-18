import { createHash, randomBytes } from "node:crypto";
import type { Role } from "@prisma/client";

export function createInvitationToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashInvitationToken(token) };
}
export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function isInvitationToken(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
export function canInviteRole(inviterRole: Role, role: Role) {
  if (inviterRole === "ADMIN") return true;
  return inviterRole === "PASTOR" && ["MEMBRO", "VOLUNTARIO", "COORDENADOR", "LIDER_GC"].includes(role);
}
