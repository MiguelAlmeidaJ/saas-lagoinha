"use client";
import { useActionState, useState } from "react";
import { createInvite, type InviteState } from "@/app/(app)/usuarios/actions";
import type { Role } from "@prisma/client";
import { roleLabels } from "@/lib/roles";
const initial:InviteState={error:"",link:"",email:""};
export function InviteForm({people,roles}:{
 people:{id:string;fullName:string;email:string|null}[];
 roles:Role[];
}) {
 const [state,action,pending]=useActionState(createInvite,initial);
 const [personId,setPersonId]=useState("");
 const person=people.find(p=>p.id===personId);
 const [copied,setCopied]=useState(false);
 const absoluteLink=state.link&&(typeof window!=="undefined"?window.location.origin+state.link:state.link);
 return <div className="space-y-4">
  <form action={action} className="grid sm:grid-cols-2 gap-3">
   <label className="block text-sm sm:col-span-2">Pessoa cadastrada
    <select name="personId" required className="input mt-1" value={personId} onChange={e=>{setPersonId(e.target.value);setCopied(false);}}>
     <option value="">Escolha a pessoa</option>{people.map(p=><option key={p.id} value={p.id}>{p.fullName}</option>)}
    </select>
   </label>
   <label className="block text-sm">E-mail de acesso
    <input key={personId} name="email" defaultValue={person?.email??""} type="email" maxLength={254} required className="input mt-1" placeholder="pessoa@email.com"/>
   </label>
   <label className="block text-sm">Perfil inicial
    <select name="role" className="input mt-1" required defaultValue="VOLUNTARIO">
     {roles.map(r=><option value={r} key={r}>{roleLabels[r]}</option>)}
    </select>
   </label>
   <button className="btn sm:col-span-2" disabled={pending||!personId}>{pending?"Criando convite...":"Gerar convite de acesso"}</button>
  </form>
  {state.error&&<p role="alert" className="text-red-800 text-sm">{state.error}</p>}
  {state.link&&<div role="status" className="rounded-xl border border-[#c4ac7c] p-4 space-y-3">
   <p className="font-semibold text-sm">Convite para {state.email} criado!</p>
   <p className="muted text-xs">Este link expira em 48 horas, pode ser usado uma vez e não será exibido novamente após sair desta tela. Envie-o em particular ao destinatário.</p>
   <p className="text-xs break-all select-all rounded-lg bg-[#f6f5f2] p-3">{absoluteLink}</p>
   <button type="button" className="btn text-xs" onClick={async()=>{await navigator.clipboard.writeText(absoluteLink);setCopied(true);}}>
    {copied?"Link copiado":"Copiar link de convite"}
   </button>
  </div>}
 </div>;
}
