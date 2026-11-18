import { requireAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canSchedule, dateTimeBR } from "@/lib/scheduling";
import { addEvent, addFunction, addTeamMember, assignPerson, respondAssignment, addUnavailability, linkAccount } from "./actions";
import { CalendarDays, UserRoundCheck, Clock3 } from "lucide-react";

export default async function SchedulingPage({searchParams}: {searchParams:Promise<{success?:string;error?:string}>}) {
 const {churchId,role,user}=await requireAccess();
 const manager=canSchedule(role);
 const [ministries,people,events,members,functions,ownPerson,query]=await Promise.all([
  prisma.ministry.findMany({where:{churchId},orderBy:{name:"asc"}}),
  manager ? prisma.person.findMany({where:{churchId},orderBy:{fullName:"asc"},take:300}) : Promise.resolve([]),
  prisma.serviceEvent.findMany({where:{churchId,startsAt:{gte:new Date(Date.now()-86400000)}},orderBy:{startsAt:"asc"},take:50,include:{ministry:true,assignments:{include:{person:true,function:true}}}}),
  manager ? prisma.teamMember.findMany({where:{churchId,active:true},include:{person:true,ministry:true}}) : Promise.resolve([]),
  prisma.ministryFunction.findMany({where:{churchId},orderBy:{name:"asc"},include:{ministry:true}}),
  prisma.person.findFirst({where:{churchId,userId:user.id}}),
  searchParams
 ]);
 const ownAssignments=ownPerson ? events.flatMap(e=>e.assignments.filter(a=>a.personId===ownPerson.id).map(a=>({event:e,assignment:a}))) : [];
 return <div className="space-y-7">
  <div><p className="eyebrow mb-3">Voluntariado</p><h1 className="text-4xl font-semibold">Escalas e equipes</h1><p className="muted mt-3">Organize equipes, eventos e a participação dos voluntários.</p></div>
  {query.success&&<p role="status" className="panel text-green-800">Operação realizada com sucesso.</p>}
  {query.error&&<p role="alert" className="panel text-red-800">Não foi possível concluir: {query.error.replaceAll("_"," ")}.</p>}
  <div className="grid sm:grid-cols-3 gap-4">
   <div className="panel"><CalendarDays className="text-[#8b7959]"/><p className="text-3xl font-semibold mt-5">{events.length}</p><p className="muted text-sm mt-1">Próximos eventos exibidos</p></div>
   <div className="panel"><UserRoundCheck className="text-[#8b7959]"/><p className="text-3xl font-semibold mt-5">{manager?members.length:"—"}</p><p className="muted text-sm mt-1">Vínculos de voluntariado ativos</p></div>
   <div className="panel"><Clock3 className="text-[#8b7959]"/><p className="text-3xl font-semibold mt-5">{ownAssignments.filter(x=>x.assignment.status==="PENDENTE").length}</p><p className="muted text-sm mt-1">Minhas confirmações pendentes</p></div>
  </div>
  {manager&&<div className="grid xl:grid-cols-2 gap-5">
   <section className="panel space-y-4"><h2 className="text-lg font-semibold">1. Vincular voluntário à equipe</h2>
    <form action={addTeamMember} className="space-y-3">
     <label className="block text-sm">Ministério<select name="ministryId" required className="input mt-1"><option value="">Selecione</option>{ministries.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
     <label className="block text-sm">Pessoa<select name="personId" required className="input mt-1"><option value="">Selecione</option>{people.map(p=><option key={p.id} value={p.id}>{p.fullName}</option>)}</select></label>
     <button className="btn">Adicionar à equipe</button>
    </form>
    <p className="muted text-xs">É necessário cadastrar pessoas e ministérios primeiro.</p>
   </section>
   <section className="panel space-y-4"><h2 className="text-lg font-semibold">2. Cadastrar função</h2>
    <form action={addFunction} className="space-y-3">
     <label className="block text-sm">Ministério<select name="ministryId" required className="input mt-1"><option value="">Selecione</option>{ministries.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
     <label className="block text-sm">Função<input name="name" required maxLength={100} minLength={2} placeholder="Ex.: Vocal, recepção, câmera" className="input mt-1"/></label>
     <button className="btn">Cadastrar função</button>
    </form>
   </section>
   <section className="panel space-y-4"><h2 className="text-lg font-semibold">3. Criar culto ou evento</h2>
    <form action={addEvent} className="space-y-3">
     <label className="block text-sm">Ministério<select name="ministryId" required className="input mt-1"><option value="">Selecione</option>{ministries.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
     <label className="block text-sm">Título<input name="title" required minLength={2} maxLength={160} className="input mt-1" placeholder="Ex.: Culto de domingo — Recepção"/></label>
     <div className="grid sm:grid-cols-2 gap-3">
      <label className="block text-sm">Início<input name="startsAt" type="datetime-local" required className="input mt-1"/></label>
      <label className="block text-sm">Fim<input name="endsAt" type="datetime-local" required className="input mt-1"/></label>
     </div>
     <label className="block text-sm">Local<input name="location" maxLength={160} className="input mt-1" placeholder="Opcional"/></label>
     <p className="muted text-xs">Horários em Brasília (America/Sao_Paulo).</p>
     <button className="btn">Criar evento</button>
    </form>
   </section>
   <section className="panel space-y-4"><h2 className="text-lg font-semibold">4. Montar escala</h2>
    <form action={assignPerson} className="space-y-3">
     <label className="block text-sm">Evento<select name="eventId" required className="input mt-1"><option value="">Selecione</option>{events.map(e=><option key={e.id} value={e.id}>{e.title} — {dateTimeBR(e.startsAt)}</option>)}</select></label>
     <label className="block text-sm">Voluntário<select name="personId" required className="input mt-1"><option value="">Selecione</option>{members.map(m=><option key={m.id} value={m.personId}>{m.person.fullName} ({m.ministry.name})</option>)}</select></label>
     <label className="block text-sm">Função (opcional)<select name="functionId" className="input mt-1"><option value="">Sem função específica</option>{functions.map(f=><option key={f.id} value={f.id}>{f.name} ({f.ministry.name})</option>)}</select></label>
     <p className="muted text-xs">A validação no servidor impede voluntários fora da equipe, indisponibilidades cadastradas e conflitos já existentes. A confirmação é feita pelo voluntário vinculado à conta.</p>
     <button className="btn">Adicionar à escala</button>
    </form>
   </section>
   <section className="panel space-y-4"><h2 className="text-lg font-semibold">Vincular pessoa a uma conta</h2>
    <form action={linkAccount} className="space-y-3">
     <label className="block text-sm">Pessoa<select name="personId" required className="input mt-1"><option value="">Selecione</option>{people.map(p=><option key={p.id} value={p.id}>{p.fullName}</option>)}</select></label>
     <label className="block text-sm">E-mail de uma conta existente na igreja<input type="email" name="email" required className="input mt-1" placeholder="conta@exemplo.com"/></label>
     <button className="btn">Vincular conta</button>
    </form>
    <p className="muted text-xs">As contas ainda são provisionadas separadamente. Esse vínculo habilita o voluntário a responder às escalas.</p>
   </section>
  </div>}
  {ownPerson&&<section className="panel space-y-4"><h2 className="text-lg font-semibold">Minha indisponibilidade</h2>
   <form action={addUnavailability} className="grid sm:grid-cols-2 gap-3">
    <input type="hidden" name="personId" value={ownPerson.id}/>
    <label className="text-sm">Início<input name="startsAt" className="input mt-1" type="datetime-local" required/></label>
    <label className="text-sm">Fim<input name="endsAt" className="input mt-1" type="datetime-local" required/></label>
    <label className="text-sm sm:col-span-2">Motivo (opcional)<input name="reason" className="input mt-1" maxLength={250}/></label>
    <button className="btn sm:col-span-2">Registrar indisponibilidade</button>
   </form>
  </section>}
  <section className="panel space-y-5"><h2 className="text-lg font-semibold">Próximas escalas</h2>
   {events.length===0&&<p className="muted text-sm">Nenhum evento cadastrado para os próximos dias.</p>}
   {events.map(e=><article key={e.id} className="border-t pt-4 border-[#e5e2dc]">
    <div className="flex flex-wrap gap-2 justify-between"><div><p className="text-sm text-[#8b7959] font-medium">{e.ministry.name}</p><h3 className="font-semibold text-lg">{e.title}</h3><p className="muted text-sm">{dateTimeBR(e.startsAt)} — {dateTimeBR(e.endsAt)}{e.location?" • "+e.location:""}</p></div><span className="muted text-sm">{manager?e.assignments.length+" pessoa(s)":"Minha participação"}</span></div>
    <div className="mt-3 space-y-2">{e.assignments.filter(a=>manager||a.person.userId===user.id).map(a=><div key={a.id} className="bg-[#f7f6f3] rounded-xl p-3 flex gap-3 items-center justify-between flex-wrap"><div><p className="text-sm font-medium">{a.person.fullName}{a.function?" • "+a.function.name:""}</p><p className="muted text-xs">Status: {a.status.toLowerCase()}</p></div>{a.status==="PENDENTE"&&(manager||a.person.userId===user.id)&&<div className="flex gap-2"><form action={respondAssignment}><input type="hidden" name="assignmentId" value={a.id}/><input type="hidden" name="decision" value="CONFIRMADA"/><button className="text-sm font-semibold border px-3 py-2 rounded-lg">Confirmar</button></form><form action={respondAssignment}><input type="hidden" name="assignmentId" value={a.id}/><input type="hidden" name="decision" value="RECUSADA"/><button className="text-sm text-red-800 border px-3 py-2 rounded-lg">Recusar</button></form></div>}</div>)}</div>
   </article>)}
  </section>
 </div>;
}
