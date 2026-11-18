import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roleLabels } from "@/lib/roles";
import { InviteForm } from "@/components/users/invite-form";
import { revokeInvite } from "./actions";
import type { Role } from "@prisma/client";
import { UserPlus, ShieldCheck } from "lucide-react";
export default async function UsersPage({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}) {
 const {churchId,role}=await requireAccess();
 if(role!=="ADMIN"&&role!=="PASTOR") redirect("/dashboard");
 const [people,memberships,invitations,query]=await Promise.all([
  prisma.person.findMany({where:{churchId,userId:null},select:{id:true,fullName:true,email:true},orderBy:{fullName:"asc"},take:300}),
  prisma.membership.findMany({where:{churchId},select:{role:true,user:{select:{id:true,name:true,email:true,active:true}}},orderBy:{user:{name:"asc"}},take:200}),
  prisma.invitation.findMany({where:{churchId},select:{
   id:true,email:true,role:true,expiresAt:true,usedAt:true,revokedAt:true,createdAt:true,
   person:{select:{fullName:true}}},orderBy:{createdAt:"desc"},take:100}),
  searchParams
 ]);
 const roles=(role==="ADMIN"?
  ["MEMBRO","VOLUNTARIO","LIDER_GC","COORDENADOR","FINANCEIRO","PASTOR","ADMIN"]:
  ["MEMBRO","VOLUNTARIO","LIDER_GC","COORDENADOR"]) as Role[];
 const now=new Date();
 return <div className="space-y-7">
  <div><p className="eyebrow mb-2">Administração de acessos</p><h1 className="text-3xl sm:text-4xl font-semibold">Usuários e convites</h1><p className="muted mt-2">Convide pessoas com segurança e conecte o acesso ao cadastro da igreja.</p></div>
  {query.success&&<p role="status" className="text-green-800">Convite revogado.</p>}
  {query.error&&<p role="alert" className="text-red-800">Não foi possível realizar a operação.</p>}
  <div className="grid md:grid-cols-2 gap-4">
   <div className="panel"><UserPlus className="text-[#8b7959]"/><p className="text-3xl font-semibold mt-5">{memberships.length}</p><p className="muted text-sm mt-1">Usuários exibidos (limite 200)</p></div>
   <div className="panel"><ShieldCheck className="text-[#8b7959]"/><p className="text-3xl font-semibold mt-5">{invitations.filter(i=>!i.usedAt&&!i.revokedAt&&i.expiresAt>now).length}</p><p className="muted text-sm mt-1">Convites ativos exibidos</p></div>
  </div>
  <section className="panel space-y-4"><h2 className="text-xl font-semibold">Convidar pessoa</h2>
   <p className="muted text-sm">É necessário cadastrar a pessoa em Pessoas antes de criar a conta. Não há envio de e-mail integrado: copie o link gerado e compartilhe-o em particular.</p>
   <InviteForm people={people} roles={roles}/>
  </section>
  <section className="panel"><h2 className="text-xl font-semibold mb-4">Pessoas com acesso</h2>
   <div className="table-wrap"><table className="table"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th></tr></thead><tbody>{memberships.map(m=><tr key={m.user.id}>
    <td>{m.user.name}</td><td>{m.user.email}</td><td>{roleLabels[m.role]}</td><td>{m.user.active?"Ativo":"Inativo"}</td>
   </tr>)}</tbody></table></div>{memberships.length===0&&<p className="muted text-sm">Nenhuma conta vinculada.</p>}
  </section>
  <section className="panel"><h2 className="text-xl font-semibold mb-4">Convites emitidos</h2>
   <div className="table-wrap"><table className="table"><thead><tr><th>Pessoa</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th>Ação</th></tr></thead><tbody>{invitations.map(i=>{
    const active=!i.usedAt&&!i.revokedAt&&i.expiresAt>now;
    return <tr key={i.id}><td>{i.person.fullName}</td><td>{i.email}</td><td>{roleLabels[i.role]}</td>
     <td>{i.usedAt?"Utilizado":i.revokedAt?"Revogado":i.expiresAt<=now?"Expirado":"Ativo"}</td>
     <td>{active&&<form action={revokeInvite}><input type="hidden" name="id" value={i.id}/><button className="text-red-800 text-sm underline">Revogar</button></form>}</td>
    </tr>;
   })}</tbody></table></div>{invitations.length===0&&<p className="muted text-sm">Nenhum convite emitido.</p>}
  </section>
 </div>;
}
