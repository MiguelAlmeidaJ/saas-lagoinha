import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
export const hashResetToken=hash;
export const makeResetToken=()=>{const token=randomBytes(32).toString("base64url");return {token,tokenHash:hash(token)};};
export const validResetToken=(value:string)=>/^[A-Za-z0-9_-]{43}$/.test(value);

const MAX_FAILURES=5;
const LOCK_MINUTES=15;
const WINDOW_MINUTES=15;
export async function isLoginLocked(email:string){
 const row=await prisma.loginThrottle.findUnique({where:{emailHash:hash(email)}});
 return Boolean(row?.lockedUntil&&row.lockedUntil>new Date());
}
export async function recordLoginFailure(email:string){
 const key=hash(email);
 const now=new Date();
 // Um update condicional atômico serializa as tentativas por e-mail no banco.
 // A janela é reaberta se o registro ficou inativo por tempo suficiente.
 await prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
  const current=await tx.loginThrottle.findUnique({where:{emailHash:key}});
  const fresh=!current||current.updatedAt.getTime()<now.getTime()-WINDOW_MINUTES*60000;
  const failures=(fresh?0:current.failures)+1;
  const lockedUntil=failures>=MAX_FAILURES?new Date(now.getTime()+LOCK_MINUTES*60000):null;
  await tx.loginThrottle.upsert({where:{emailHash:key},
   create:{emailHash:key,failures,lockedUntil,updatedAt:now},
   update:{failures,lockedUntil,updatedAt:now}});
 });
}
export async function clearLoginFailures(email:string){
 await prisma.loginThrottle.deleteMany({where:{emailHash:hash(email)}});
}
