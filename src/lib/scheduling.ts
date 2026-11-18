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

import { prisma } from "@/lib/prisma";
export async function canManageMinistry(churchId:string,userId:string,role:Role,ministryId:string) {
 if(role==="ADMIN"||role==="PASTOR") return true;
 if(role!=="COORDENADOR") return false;
 return (await prisma.ministryCoordinator.count({where:{churchId,userId,ministryId}}))>0;
}
export async function permittedMinistryIds(churchId:string,userId:string,role:Role) {
 if(role==="ADMIN"||role==="PASTOR") return null;
 if(role!=="COORDENADOR") return [];
 const rows=await prisma.ministryCoordinator.findMany({where:{churchId,userId},select:{ministryId:true}});
 return rows.map(r=>r.ministryId);
}
