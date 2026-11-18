import { requireAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roleLabels } from "@/lib/roles";
import { changeMyPassword, updateMyProfile } from "./actions";
import { KeyRound, UserRound } from "lucide-react";
export default async function ProfilePage({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}){
 const {churchId,user,role,church}=await requireAccess();
 const [person,query]=await Promise.all([
  prisma.person.findFirst({where:{churchId,userId:user.id},select:{phone:true}}),searchParams
 ]);
 const errors:Record<string,string>={
  validacao:"Confira nome e telefone.",
  senha_invalida:"A nova senha deve ter de 12 a 128 caracteres e coincidir com a confirmação.",
  senha_atual:"A senha atual está incorreta."
 };
 return <div className="max-w-3xl space-y-7">
  <div><p className="eyebrow mb-2">Minha conta</p><h1 className="text-3xl sm:text-4xl font-semibold">Meu perfil</h1>
   <p className="muted mt-3">Atualize seus dados e proteja sua conta de acesso.</p></div>
  {query.error&&<p role="alert" className="rounded-xl bg-red-50 text-red-800 p-4 text-sm">{errors[query.error]??"Não foi possível concluir."}</p>}
  {query.success&&<p role="status" className="rounded-xl bg-green-50 text-green-800 p-4 text-sm">Perfil atualizado.</p>}
  <section className="panel space-y-5"><div className="flex items-center gap-3"><UserRound className="text-[#8b7959]"/><h2 className="text-xl font-semibold">Dados pessoais</h2></div>
   <form action={updateMyProfile} className="space-y-4">
    <label className="block text-sm font-semibold">Nome completo<input className="input mt-2" name="name" defaultValue={user.name} required minLength={2} maxLength={160}/></label>
    <label className="block text-sm font-semibold">Telefone<input className="input mt-2" name="phone" defaultValue={person?.phone??""} maxLength={30}/></label>
    <div className="grid sm:grid-cols-2 gap-3 text-sm muted"><p>E-mail de acesso: <strong className="text-[#22221f]">{user.email}</strong></p>
     <p>Perfil: <strong className="text-[#22221f]">{roleLabels[role]}</strong></p></div>
    <p className="text-xs muted">Igreja: {church.name}. A alteração do e-mail de acesso depende da administração para evitar perda de acesso.</p>
    <button className="btn">Salvar meu perfil</button>
   </form>
  </section>
  <section className="panel space-y-5"><div className="flex items-center gap-3"><KeyRound className="text-[#8b7959]"/><h2 className="text-xl font-semibold">Trocar senha</h2></div>
   <form action={changeMyPassword} className="space-y-4">
    <label className="block text-sm font-semibold">Senha atual<input type="password" autoComplete="current-password" name="currentPassword" className="input mt-2" required/></label>
    <label className="block text-sm font-semibold">Nova senha<input type="password" autoComplete="new-password" name="newPassword" minLength={12} maxLength={128} className="input mt-2" required/></label>
    <label className="block text-sm font-semibold">Confirmar nova senha<input type="password" autoComplete="new-password" name="confirmation" minLength={12} maxLength={128} className="input mt-2" required/></label>
    <p className="text-xs muted">Ao alterar a senha, todas as sessões serão encerradas e será necessário entrar novamente.</p>
    <button className="btn">Alterar senha</button>
   </form>
  </section>
 </div>;
}
