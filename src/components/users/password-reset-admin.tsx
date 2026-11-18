"use client";
import { useActionState,useState } from "react";
import { generatePasswordReset, emptyResetLinkState } from "@/app/(app)/usuarios/reset-actions";
export function PasswordResetAdmin({userId,name}:{userId:string;name:string}){
 const [state,action,pending]=useActionState(generatePasswordReset,emptyResetLinkState);
 const [copied,setCopied]=useState(false);
 const link=state.link?(typeof window==="undefined"?state.link:window.location.origin+state.link):"";
 return <div className="space-y-2">
  <form action={action}><input type="hidden" name="userId" value={userId}/>
   <button className="text-xs underline underline-offset-4 disabled:opacity-50" disabled={pending}>{pending?"Gerando...":"Gerar recuperação de senha"}</button>
  </form>
  {state.error&&<p role="alert" className="text-red-700 text-xs">{state.error}</p>}
  {link&&<div className="rounded-lg bg-[#f5f2e9] p-3 space-y-2 max-w-sm">
   <p className="text-xs font-medium">Link de uso único para {name} ({state.email}). Expira em 30 minutos.</p>
   <p className="text-xs break-all select-all">{link}</p>
   <p className="text-xs text-red-800">Compartilhe apenas por canal privado. Não publique este link.</p>
   <button type="button" className="text-xs font-semibold underline" onClick={async()=>{await navigator.clipboard.writeText(link);setCopied(true);}}>{copied?"Copiado":"Copiar link"}</button>
  </div>}
 </div>;
}
