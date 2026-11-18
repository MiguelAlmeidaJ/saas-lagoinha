import type { Role } from "@prisma/client";
export const roleLabels: Record<Role,string> = {
 ADMIN:"Administrador", PASTOR:"Pastor", FINANCEIRO:"Financeiro",
 COORDENADOR:"Coordenador", LIDER_GC:"Líder de GC", VOLUNTARIO:"Voluntário", MEMBRO:"Membro"
};
