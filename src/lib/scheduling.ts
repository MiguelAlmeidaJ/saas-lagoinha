import type { Role } from "@prisma/client";
export function canSchedule(role: Role) { return role === "ADMIN" || role === "PASTOR" || role === "COORDENADOR"; }
export function parseChurchDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const parsed = new Date(value + ":00-03:00");
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
export const dateTimeBR = (date: Date) => new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo"
}).format(date);
