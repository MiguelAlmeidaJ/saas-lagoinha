"use client";
import Link from "next/link";
import { useActionState } from "react";
import { completePasswordReset,type ResetState } from "@/app/(auth)/redefinir-senha/[token]/actions";
export function PasswordResetForm({token}:{token:string}){
 const [state,action,pending]=useActionState(completePasswordReset,{error:"",success:false} as ResetState);
 if(state.success)return <div className="space-y-4">
  <h1 className="text-3xl font-semibold">Senha atualizada</h1>
  <p className="muted text-sm">Todas as sessões anteriores foram encerradas. Entre com sua nova senha.</p>
  <Link className="btn inline-block" href="/login">Ir para o login</Link>
 </div>;
 return <div className="space-y-5"><p className="eyebrow">Segurança da conta</p><h1 className="text-3xl font-semibold">Redefinir senha</h1>
  <form action={action} className="space-y-4">
   <input type="hidden" name="token" value={token}/>
   <label className="block text-sm font-semibold">Nova senha<input type="password" name="password" minLength={12} maxLength={128} autoComplete="new-password" required className="input mt-2"/></label>
   <label className="block text-sm font-semibold">Confirmar senha<input type="password" name="confirmation" minLength={12} maxLength={128} autoComplete="new-password" required className="input mt-2"/></label>
   {state.error&&<p className="text-red-800 text-sm" role="alert">{state.error}</p>}
   <button disabled={pending} className="btn w-full">{pending?"Salvando...":"Salvar nova senha"}</button>
  </form><p className="text-xs muted">Este link é individual e expira em 30 minutos.</p>
 </div>;
}
