"use client";
import Link from "next/link";
import { useActionState } from "react";
import { activateInvitation, type ActivationState } from "@/app/(auth)/ativar/[token]/actions";
const initial:ActivationState={error:"",success:false};
export function ActivateForm({token,email,personName,churchName}:{
 token:string;email:string;personName:string;churchName:string;
}) {
 const [state,action,pending]=useActionState(activateInvitation,initial);
 if(state.success) return <div className="space-y-5">
  <h1 className="text-3xl font-semibold">Conta ativada!</h1>
  <p className="muted text-sm">Você já pode entrar no Lagoinha Gestão com seu e-mail e senha.</p>
  <Link className="btn inline-block" href="/login">Ir para o login</Link>
 </div>;
 return <div className="space-y-5">
  <p className="eyebrow">Convite para a igreja</p>
  <h1 className="text-3xl font-semibold">Bem-vindo(a), {personName.split(" ")[0]}!</h1>
  <p className="muted text-sm">Crie sua senha para acessar {churchName}.</p>
  <form action={action} className="space-y-4">
   <input type="hidden" name="token" value={token}/>
   <div><label className="text-sm font-semibold block mb-2">E-mail de acesso</label><p className="input muted">{email}</p></div>
   <label className="block text-sm font-semibold">Criar senha
    <input className="input mt-2" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required placeholder="Mínimo de 12 caracteres"/>
   </label>
   <label className="block text-sm font-semibold">Confirmar senha
    <input className="input mt-2" name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required placeholder="Digite novamente"/>
   </label>
   {state.error&&<p role="alert" className="text-red-800 text-sm">{state.error}</p>}
   <button className="btn w-full" disabled={pending}>{pending?"Ativando...":"Ativar minha conta"}</button>
  </form>
  <p className="muted text-xs">O convite é individual e de uso único. Nunca compartilhe sua senha.</p>
 </div>;
}
