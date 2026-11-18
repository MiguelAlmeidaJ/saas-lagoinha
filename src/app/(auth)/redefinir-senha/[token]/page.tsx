import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashResetToken,validResetToken } from "@/lib/account-security";
import { PasswordResetForm } from "@/components/users/password-reset-form";
export const dynamic="force-dynamic";
export const metadata={title:"Redefinir senha | Lagoinha Gestão",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function ResetPage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 if(!validResetToken(token)) notFound();
 const reset=await prisma.passwordReset.findUnique({where:{tokenHash:hashResetToken(token)},
  select:{expiresAt:true,usedAt:true,revokedAt:true,user:{select:{active:true}}}
 });
 const valid=reset&&!reset.usedAt&&!reset.revokedAt&&reset.expiresAt>new Date()&&reset.user.active;
 return <main className="min-h-screen grid lg:grid-cols-2">
  <section className="hidden lg:flex flex-col justify-between bg-[#22221f] text-white p-14">
   <span className="font-bold tracking-widest">LAGOINHA / ALÉM PARAÍBA</span>
   <h2 className="text-5xl font-semibold leading-tight">Grande para servir, pequena para se importar.</h2><p className="text-white/50 text-xs">Lagoinha Gestão</p>
  </section>
  <section className="flex justify-center items-center p-6"><div className="w-full max-w-md panel">
   {valid?<PasswordResetForm token={token}/>:<div className="space-y-4">
    <h1 className="text-2xl font-semibold">Link indisponível</h1>
    <p className="muted text-sm">Peça à administração um novo link de recuperação de senha.</p>
    <Link href="/login" className="btn inline-block">Voltar ao login</Link>
   </div>}
  </div></section>
 </main>;
}
