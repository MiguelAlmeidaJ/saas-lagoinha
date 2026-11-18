import Link from "next/link";
import { CalendarCheck2, CheckCircle2, Clock3, ArrowRightLeft, CalendarOff, MapPin, UsersRound } from "lucide-react";
import { requireAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dateTimeBR } from "@/lib/scheduling";
import { respondAssignment, addUnavailability } from "@/app/(app)/escalas/actions";
import { requestSwap, cancelSwap } from "@/app/(app)/escalas/swap-actions";

const statusLabel={PENDENTE:"Aguardando confirmação",CONFIRMADA:"Confirmada",RECUSADA:"Recusada"} as const;
const requestLabel={PENDENTE:"Aguardando análise",APROVADA:"Aprovada",RECUSADA:"Recusada",CANCELADA:"Cancelada"} as const;
const statusStyle={PENDENTE:"bg-amber-50 text-amber-800",CONFIRMADA:"bg-emerald-50 text-emerald-800",RECUSADA:"bg-rose-50 text-rose-800"} as const;
function Status({value}:{value:keyof typeof statusLabel}) {
 return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[value]}`}>{statusLabel[value]}</span>;
}

export default async function MySchedulesPage({searchParams}:{searchParams:Promise<{success?:string;error?:string}>}) {
 const {churchId,user}=await requireAccess();
 const query=await searchParams;
 const person=await prisma.person.findFirst({
   where:{churchId,userId:user.id},select:{id:true,fullName:true}
 });
 if(!person) return <div className="max-w-2xl mx-auto space-y-6">
  <div><p className="eyebrow">Área do voluntário</p><h1 className="text-3xl font-semibold mt-2">Minhas escalas</h1></div>
  <section className="panel space-y-4"><UsersRound className="text-[#8b7959]"/><h2 className="text-xl font-semibold">Seu cadastro ainda não está vinculado</h2>
   <p className="muted text-sm leading-6">Entre em contato com a secretaria ou com a liderança do seu ministério para vincular seu cadastro de pessoa à sua conta. Assim, você poderá ver e confirmar suas escalas aqui.</p>
   <Link href="/dashboard" className="inline-flex text-sm font-semibold underline underline-offset-4">Voltar ao início</Link>
  </section>
 </div>;

 const now=new Date();
 const [assignments,requests,unavailability]=await Promise.all([
  prisma.scheduleAssignment.findMany({
   where:{churchId,personId:person.id,event:{endsAt:{gte:now}}},
   orderBy:{event:{startsAt:"asc"}},take:80,
   include:{event:{select:{title:true,startsAt:true,endsAt:true,location:true,ministry:{select:{name:true}}}},function:{select:{name:true}}}
  }),
  prisma.swapRequest.findMany({
   where:{churchId,requesterId:user.id},
   orderBy:{createdAt:"desc"},take:30,
   select:{id:true,assignmentId:true,status:true,reason:true,createdAt:true,assignment:{select:{event:{select:{title:true,startsAt:true}}}}}
  }),
  prisma.unavailability.findMany({
   where:{churchId,personId:person.id,endsAt:{gte:now}},
   orderBy:{startsAt:"asc"},take:20,
   select:{id:true,startsAt:true,endsAt:true,reason:true}
  })
 ]);
 const activeRequestByAssignment=new Map(requests.filter(r=>r.status==="PENDENTE").map(r=>[r.assignmentId,r]));
 const pending=assignments.filter(a=>a.status==="PENDENTE").length;
 const confirmed=assignments.filter(a=>a.status==="CONFIRMADA").length;
 const next=assignments.find(a=>a.status!=="RECUSADA");
 return <div className="space-y-7 max-w-5xl mx-auto">
  <div className="flex flex-wrap items-end justify-between gap-4">
   <div><p className="eyebrow mb-3">Minha igreja • Voluntariado</p>
    <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Olá, {person.fullName.split(" ")[0]}!</h1>
    <p className="muted mt-2">Sua agenda de serviço, confirmações e disponibilidades.</p></div>
   <Link href="/dashboard" className="text-sm font-semibold underline underline-offset-4">Voltar ao início</Link>
  </div>
  {query.success&&<p role="status" className="rounded-xl bg-emerald-50 text-emerald-900 p-4 text-sm">Solicitação registrada com sucesso.</p>}
  {query.error&&<p role="alert" className="rounded-xl bg-rose-50 text-rose-900 p-4 text-sm">Não foi possível concluir. Verifique a situação da escala e tente novamente.</p>}
  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
   <div className="panel"><Clock3 className="text-[#b49a6a]"/><p className="text-3xl font-semibold mt-4">{pending}</p><p className="text-xs muted mt-2">A confirmar</p></div>
   <div className="panel"><CheckCircle2 className="text-[#b49a6a]"/><p className="text-3xl font-semibold mt-4">{confirmed}</p><p className="text-xs muted mt-2">Confirmadas</p></div>
   <div className="panel col-span-2 lg:col-span-1"><CalendarCheck2 className="text-[#b49a6a]"/><p className="text-3xl font-semibold mt-4">{assignments.length}</p><p className="text-xs muted mt-2">Escalas futuras e em andamento</p></div>
  </div>
  {next&&<section className="rounded-2xl bg-[#22221f] text-white p-5 sm:p-7 space-y-3">
   <p className="text-[#c4ac7c] text-xs tracking-[.18em] uppercase font-semibold">Próxima escala</p>
   <h2 className="text-2xl sm:text-3xl font-semibold">{next.event.title}</h2>
   <p className="text-sm text-white/80">{dateTimeBR(next.event.startsAt)} • {next.event.ministry.name}</p>
   <p className="text-xs text-white/60">{next.function?.name??"Função a definir"}</p>
  </section>}
  <section className="space-y-4"><h2 className="text-xl font-semibold">Minhas próximas escalas</h2>
   {assignments.length===0&&<div className="panel text-sm muted">Você ainda não possui escalas futuras cadastradas.</div>}
   {assignments.map(a=>{
    const open=activeRequestByAssignment.get(a.id);
    return <article key={a.id} className="panel space-y-4">
     <div className="flex items-start justify-between flex-wrap gap-3">
      <div><p className="eyebrow mb-2">{a.event.ministry.name}</p><h3 className="text-lg font-semibold">{a.event.title}</h3>
       <p className="muted text-sm mt-2"><CalendarCheck2 size={15} className="inline mr-1"/>{dateTimeBR(a.event.startsAt)} – {dateTimeBR(a.event.endsAt)}</p>
       {a.event.location&&<p className="muted text-sm mt-1"><MapPin size={15} className="inline mr-1"/>{a.event.location}</p>}
       <p className="muted text-sm mt-1">Função: {a.function?.name??"A definir"}</p></div>
      <Status value={a.status}/>
     </div>
     {a.status==="PENDENTE"&&a.event.startsAt>now&&<div className="flex flex-wrap gap-2">
      <form action={respondAssignment}><input type="hidden" name="returnTo" value="minhas-escalas"/><input type="hidden" name="assignmentId" value={a.id}/><input type="hidden" name="decision" value="CONFIRMADA"/><button className="btn text-sm">Confirmar participação</button></form>
      <form action={respondAssignment}><input type="hidden" name="returnTo" value="minhas-escalas"/><input type="hidden" name="assignmentId" value={a.id}/><input type="hidden" name="decision" value="RECUSADA"/><button className="rounded-lg border px-4 py-3 text-sm font-medium">Não poderei servir</button></form>
     </div>}
     {a.status!=="RECUSADA"&&a.event.startsAt>now&&(!open?
      <form action={requestSwap} className="border-t pt-3 space-y-2">
       <input type="hidden" name="returnTo" value="minhas-escalas"/><input type="hidden" name="assignmentId" value={a.id}/>
       <label htmlFor={"reason-"+a.id} className="block text-sm font-medium">Precisa de substituição?</label>
       <div className="flex flex-col sm:flex-row gap-2"><input id={"reason-"+a.id} className="input flex-1" name="reason" maxLength={500} placeholder="Motivo (opcional)"/>
        <button className="rounded-lg border px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2"><ArrowRightLeft size={16}/> Solicitar troca</button></div>
      </form>
      :<div className="border-t pt-3 flex gap-3 flex-wrap justify-between items-center"><p className="text-amber-800 text-sm">Solicitação de troca em análise</p>
       <form action={cancelSwap}><input type="hidden" name="returnTo" value="minhas-escalas"/><input type="hidden" name="requestId" value={open.id}/><button className="text-sm underline underline-offset-4">Cancelar pedido</button></form>
      </div>)}
    </article>;
   })}
  </section>
  <div className="grid lg:grid-cols-2 gap-5">
   <section className="panel space-y-4"><div className="flex items-center gap-2"><CalendarOff className="text-[#8b7959]"/><h2 className="text-lg font-semibold">Informar indisponibilidade</h2></div>
    <p className="text-sm muted">Avise à liderança sobre os períodos em que não poderá servir.</p>
    <form action={addUnavailability} className="space-y-3">
     <input type="hidden" name="returnTo" value="minhas-escalas"/><input type="hidden" name="personId" value={person.id}/>
     <label className="block text-sm">Início<input type="datetime-local" name="startsAt" required className="input mt-1"/></label>
     <label className="block text-sm">Fim<input type="datetime-local" name="endsAt" required className="input mt-1"/></label>
     <label className="block text-sm">Motivo (opcional)<input name="reason" className="input mt-1" maxLength={250}/></label>
     <button className="btn w-full">Salvar indisponibilidade</button>
    </form>
    {unavailability.length>0&&<div className="border-t pt-3 space-y-2"><h3 className="font-semibold text-sm">Períodos registrados</h3>
     {unavailability.map(u=><div key={u.id} className="text-xs muted border-b py-2">{dateTimeBR(u.startsAt)} até {dateTimeBR(u.endsAt)}{u.reason?" • "+u.reason:""}</div>)}
    </div>}
   </section>
   <section className="panel space-y-4"><h2 className="text-lg font-semibold">Minhas solicitações de troca</h2>
    {requests.length===0&&<p className="text-sm muted">Você ainda não solicitou nenhuma troca.</p>}
    {requests.map(r=><div key={r.id} className="border-t pt-3"><p className="font-semibold text-sm">{r.assignment.event.title}</p>
     <p className="text-xs muted mt-1">{dateTimeBR(r.assignment.event.startsAt)} • {requestLabel[r.status]}</p>
     {r.reason&&<p className="text-xs muted mt-1">{r.reason}</p>}
    </div>)}
   </section>
  </div>
 </div>;
}
