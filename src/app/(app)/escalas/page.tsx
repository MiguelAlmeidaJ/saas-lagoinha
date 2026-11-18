import { requireAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canSchedule, dateTimeBR, permittedMinistryIds } from "@/lib/scheduling";
import { addEvent, addFunction, addTeamMember, assignPerson, respondAssignment, addUnavailability, linkAccount, createRecurringEvents } from "./actions";
import { CalendarDays, UserRoundCheck, Clock3 } from "lucide-react";
import { AssignmentForm, ReplacementForm } from "@/components/scheduling/assignment-form";
import { MonthCalendar } from "@/components/scheduling/month-calendar";
import { RequestSwapForm, CancelSwapForm, DecideSwapForm } from "@/components/scheduling/swap-request-form";
import { grantMinistryCoordinator, revokeMinistryCoordinator } from "./swap-actions";

export default async function SchedulingPage({searchParams}: {searchParams:Promise<{success?:string;error?:string;mes?:string}>}) {
 const {churchId,role,user}=await requireAccess();
 const allowedIds=await permittedMinistryIds(churchId,user.id,role);
 const globalManager=role==="ADMIN"||role==="PASTOR";
 const manager=canSchedule(role)&&(globalManager||allowedIds!==null&&allowedIds.length>0);
 const ministryScope=allowedIds===null?{}:{ministryId:{in:allowedIds}};
 const query=await searchParams;
 const dateParts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit"}).formatToParts(new Date());
 const currentMonth=dateParts.find(part=>part.type==="year")!.value+"-"+dateParts.find(part=>part.type==="month")!.value;
 const month=/^\d{4}-(0[1-9]|1[0-2])$/.test(query.mes??"")?query.mes!:currentMonth;
 const monthStart=new Date(month+"-01T00:00:00-03:00");
 const [year,number]=month.split("-").map(Number);
 const monthEnd=new Date(Date.UTC(year,number,1,3,0,0));
 const ownPerson=await prisma.person.findFirst({where:{churchId,userId:user.id}});
 const eventScope=manager?ministryScope:{assignments:{some:{personId:ownPerson?.id??"00000000-0000-0000-0000-000000000000"}}};
 const [ministries,people,events,members,functions,calendarEvents,swapRequests,coordinators]=await Promise.all([
  manager?prisma.ministry.findMany({where:{churchId,id:allowedIds===null?undefined:{in:allowedIds}},orderBy:{name:"asc"}}):Promise.resolve([]),
  manager?prisma.person.findMany({where:{churchId,...(globalManager?{}:{teamMemberships:{some:{churchId,ministryId:{in:allowedIds??[]},active:true}}})},orderBy:{fullName:"asc"},take:300}):Promise.resolve([]),
  prisma.serviceEvent.findMany({where:{churchId,...eventScope,startsAt:{gte:new Date(Date.now()-86400000)}},orderBy:{startsAt:"asc"},take:50,include:{ministry:true,assignments:{include:{person:true,function:true}}}}),
  manager?prisma.teamMember.findMany({where:{churchId,active:true,...ministryScope},include:{person:true,ministry:true}}):Promise.resolve([]),
  manager?prisma.ministryFunction.findMany({where:{churchId,...ministryScope},orderBy:{name:"asc"},include:{ministry:true}}):Promise.resolve([]),
  prisma.serviceEvent.findMany({where:{churchId,...eventScope,startsAt:{gte:monthStart,lt:monthEnd}},orderBy:{startsAt:"asc"},take:300,include:{ministry:true}}),
  prisma.swapRequest.findMany({where:{
   churchId,...(manager?ministryScope:{requesterId:user.id})
  },include:{assignment:{include:{event:true,person:true}},requester:{select:{name:true}}},
   orderBy:{createdAt:"desc"},take:40}),
  globalManager?prisma.ministryCoordinator.findMany({where:{churchId},include:{user:true,ministry:true},orderBy:{createdAt:"desc"}}):Promise.resolve([])
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
  <MonthCalendar month={month} events={calendarEvents.map(e=>({id:e.id,title:e.title,startsAt:e.startsAt,ministry:e.ministry.name}))}/>
  {globalManager&&<section className="panel space-y-4">
    <h2 className="text-lg font-semibold">Coordenadores por ministério</h2>
    <p className="muted text-sm">Somente administradores e pastores podem conceder ou retirar essa permissão. A conta deve ter o perfil COORDENADOR.</p>
    <form action={grantMinistryCoordinator} className="grid sm:grid-cols-3 gap-3">
     <select name="ministryId" className="input" required defaultValue=""><option value="">Ministério</option>{ministries.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
     <input name="email" type="email" required className="input" placeholder="E-mail do coordenador"/>
     <button className="btn">Conceder acesso</button>
    </form>
    <div className="space-y-2">{coordinators.map(c=><div key={c.id} className="flex items-center justify-between gap-3 border-t py-3">
     <span className="text-sm">{c.user.name} — {c.ministry.name}</span>
     <form action={revokeMinistryCoordinator}><input type="hidden" name="coordinatorId" value={c.id}/><button className="text-sm text-red-800 border rounded-lg px-3 py-2">Remover acesso</button></form>
    </div>)}</div>
   </section>}
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
    <AssignmentForm events={events.map(e=>({id:e.id,title:e.title,ministryId:e.ministryId,when:dateTimeBR(e.startsAt)}))} team={members.map(m=>({id:m.id,personId:m.personId,ministryId:m.ministryId,personName:m.person.fullName}))} functions={functions.map(f=>({id:f.id,ministryId:f.ministryId,name:f.name}))}/>
   </section>
   <section className="panel space-y-4"><h2 className="text-lg font-semibold">Eventos recorrentes</h2>
    <p className="muted text-sm">Crie de 2 a 8 encontros semanais com os mesmos horários.</p>
    <form action={createRecurringEvents} className="space-y-3">
     <label className="block text-sm">Ministério<select name="ministryId" className="input mt-1" required><option value="">Selecione</option>{ministries.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
     <label className="block text-sm">Nome do evento<input name="title" className="input mt-1" required minLength={2} maxLength={160}/></label>
     <label className="block text-sm">Local<input name="location" className="input mt-1" maxLength={160}/></label>
     <div className="grid grid-cols-2 gap-2">
      <label className="block text-sm">Primeiro início<input name="startsAt" type="datetime-local" className="input mt-1" required/></label>
      <label className="block text-sm">Primeiro fim<input name="endsAt" type="datetime-local" className="input mt-1" required/></label>
     </div>
     <label className="block text-sm">Quantidade de semanas<select name="count" defaultValue="4" className="input mt-1">{Array.from({length:7},(_,i)=>i+2).map(n=><option value={n} key={n}>{n} semanas</option>)}</select></label>
     <button className="btn">Criar série semanal</button>
    </form>
   </section>
   {globalManager&&<section className="panel space-y-4"><h2 className="text-lg font-semibold">Vincular pessoa a uma conta</h2>
    <form action={linkAccount} className="space-y-3">
     <label className="block text-sm">Pessoa<select name="personId" required className="input mt-1"><option value="">Selecione</option>{people.map(p=><option key={p.id} value={p.id}>{p.fullName}</option>)}</select></label>
     <label className="block text-sm">E-mail de uma conta existente na igreja<input type="email" name="email" required className="input mt-1" placeholder="conta@exemplo.com"/></label>
     <button className="btn">Vincular conta</button>
    </form>
    <p className="muted text-xs">As contas ainda são provisionadas separadamente. Esse vínculo habilita o voluntário a responder às escalas.</p>
   </section>}
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
  <section className="panel space-y-4">
   <h2 className="text-lg font-semibold">{manager?"Solicitações de troca":"Minhas solicitações de troca"}</h2>
   {swapRequests.length===0&&<p className="muted text-sm">Nenhuma solicitação cadastrada.</p>}
   {swapRequests.map(r=><article key={r.id} className="border-t pt-4 space-y-3">
    <div className="flex justify-between gap-4 flex-wrap"><div>
     <p className="font-semibold text-sm">{r.assignment.event.title} — {dateTimeBR(r.assignment.event.startsAt)}</p>
     <p className="muted text-xs">Solicitante: {r.requester.name} • Status: {r.status.toLowerCase()}</p>
     {r.reason&&<p className="text-sm mt-2">{r.reason}</p>}
    </div>{r.status==="PENDENTE"&&r.requesterId===user.id&&<CancelSwapForm requestId={r.id}/>}</div>
    {r.status==="PENDENTE"&&manager&&r.requesterId!==user.id&&<DecideSwapForm requestId={r.id} team={members.filter(m=>m.ministryId===r.ministryId&&m.personId!==r.assignment.personId).map(m=>({id:m.personId,personName:m.person.fullName}))}/>}
   </article>)}
  </section>
  <section className="panel space-y-5"><h2 className="text-lg font-semibold">Próximas escalas</h2>
   {events.length===0&&<p className="muted text-sm">Nenhum evento cadastrado para os próximos dias.</p>}
   {events.map(e=><article key={e.id} className="border-t pt-4 border-[#e5e2dc]">
    <div className="flex flex-wrap gap-2 justify-between"><div><p className="text-sm text-[#8b7959] font-medium">{e.ministry.name}</p><h3 className="font-semibold text-lg">{e.title}</h3><p className="muted text-sm">{dateTimeBR(e.startsAt)} — {dateTimeBR(e.endsAt)}{e.location?" • "+e.location:""}</p></div><span className="muted text-sm">{manager?e.assignments.length+" pessoa(s)":"Minha participação"}</span></div>
    <div className="mt-3 space-y-2">{e.assignments.filter(a=>manager||a.person.userId===user.id).map(a=><div key={a.id} className="bg-[#f7f6f3] rounded-xl p-3 flex gap-3 items-center justify-between flex-wrap"><div><p className="text-sm font-medium">{a.person.fullName}{a.function?" • "+a.function.name:""}</p><p className="muted text-xs">Status: {a.status.toLowerCase()}</p></div>{a.status==="PENDENTE"&&(manager||a.person.userId===user.id)&&<div className="flex gap-2"><form action={respondAssignment}><input type="hidden" name="assignmentId" value={a.id}/><input type="hidden" name="decision" value="CONFIRMADA"/><button className="text-sm font-semibold border px-3 py-2 rounded-lg">Confirmar</button></form><form action={respondAssignment}><input type="hidden" name="assignmentId" value={a.id}/><input type="hidden" name="decision" value="RECUSADA"/><button className="text-sm text-red-800 border px-3 py-2 rounded-lg">Recusar</button></form></div>}{manager&&<ReplacementForm assignmentId={a.id} ministryId={e.ministryId} currentPersonId={a.personId} team={members.map(m=>({id:m.id,personId:m.personId,ministryId:m.ministryId,personName:m.person.fullName}))}/>}{a.person.userId===user.id&&e.startsAt>new Date()&&!swapRequests.some(r=>r.assignmentId===a.id&&r.status==="PENDENTE")&&<RequestSwapForm assignmentId={a.id}/>}
    {a.person.userId===user.id&&swapRequests.some(r=>r.assignmentId===a.id&&r.status==="PENDENTE")&&<span className="text-xs muted">Troca solicitada</span>}</div>)}</div>
   </article>)}
  </section>
 </div>;
}
