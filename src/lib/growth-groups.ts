import type {Role} from "@prisma/client";
import {prisma} from "@/lib/prisma";
export const gcAdmin=(role:Role)=>role==="ADMIN"||role==="PASTOR";
export async function canManageGroup(churchId:string,userId:string,role:Role,groupId:string){
 if(gcAdmin(role))return Boolean(await prisma.growthGroup.count({where:{churchId,id:groupId}}));
 if(role!=="LIDER_GC")return false;
 return Boolean(await prisma.growthGroup.count({where:{
  churchId,id:groupId,leader:{userId,user:{active:true,memberships:{some:{churchId,role:"LIDER_GC"}}}}
 }}));
}
export const gcDays=["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
