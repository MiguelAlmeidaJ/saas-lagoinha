import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashInvitationToken, isInvitationToken } from "@/lib/invitations";
import { ActivateForm } from "@/components/users/activate-form";
export const dynamic="force-dynamic";
export const metadata={title:"Ativar conta | Lagoinha Gestão",robots:{index:false,follow:false}};
export default async function ActivatePage({params}:{params:Promise<{token:string}>}) {
 const {token}=await params;
 if(!isInvitationToken(token)) notFound();
 const invitation=await prisma.invitation.findUnique({
  where:{tokenHash:hashInvitationToken(token)},
  select:{email:true,usedAt:true,revokedAt:true,expiresAt:true,
   church:{select:{name:true}},person:{select:{fullName:true,userId:true}}}
 });
 const available=invitation&&!invitation.usedAt&&!invitation.revokedAt&&
  invitation.expiresAt>new Date()&&!invitation.person.userId;
 return <main className="min-h-screen grid lg:grid-cols-2">
  <section className="hidden lg:flex flex-col justify-between bg-[#22221f] text-white p-14">
   <span className="font-bold tracking-widest">LAGOINHA / ALÉM PARAÍBA</span>
   <div><p className="text-[#c4ac7c] text-xs tracking-widest uppercase mb-4">Bem-vindo à família</p>
   <h2 className="text-5xl font-semibold leading-tight">Grande para servir, pequena para se importar.</h2></div>
   <p className="text-white/50 text-xs">Lagoinha Gestão</p>
  </section>
  <section className="flex justify-center items-center p-6">
   <div className="w-full max-w-md panel">
    {available?
     <ActivateForm token={token} email={invitation.email} personName={invitation.person.fullName} churchName={invitation.church.name}/>:
     <div className="space-y-4"><p className="eyebrow">Ativação de conta</p>
      <h1 className="text-2xl font-semibold">Convite indisponível</h1>
      <p className="muted text-sm">Esse convite está expirado, foi utilizado ou revogado. Peça um novo link ao administrador da igreja.</p>
      <Link href="/login" className="btn inline-block">Voltar ao login</Link>
     </div>}
   </div>
  </section>
 </main>;
}
