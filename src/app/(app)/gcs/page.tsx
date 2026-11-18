import {redirect} from "next/navigation";
import {requireAccess} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {dateTimeBR} from "@/lib/scheduling";
import {gcAdmin,gcDays} from "@/lib/growth-groups";
import {createGroup,addGroupMember,setGroupMemberActive,createMeeting,markAttendance,setGroupActive} from "./actions";
import {House,UsersRound,CalendarDays} from "lucide-react";

const label={PRESENTE:"Presente",AUSENTE:"Ausente",JUSTIFICADO:"Justificado"} as const;

export default async function GrowthGroupsPage({searchParams}:{searchParams:Promise<{success?:string;error?:string}>}){
 const {churchId,user,role}=await requireAccess();
 const admin=gcAdmin(role);
 if(!admin&&role!=="LIDER_GC")redirect("/dashboard");
 const scope=admin?{}:{leader:{userId:user.id}};
 const [groups,people,leaders,query]=await Promise.all([
  prisma.growthGroup.findMany({where:{churchId,...scope},orderBy:{name:"asc"},take:100,
   include:{leader:{select:{fullName:true}},members:{include:{person:{select:{fullName:true}}},orderBy:{joinedAt:"asc"}},
    meetings:{orderBy:{startsAt:"desc"},take:12,include:{attendances:true}}}}),
  prisma.person.findMany({where:{churchId},select:{id:true,fullName:true},orderBy:{fullName:"asc"},take:300}),
  admin?prisma.person.findMany({where:{churchId,user:{active:true,memberships:{some:{churchId,role:"LIDER_GC"}}}},
    select:{id:true,fullName:true},orderBy:{fullName:"asc"},take:150}):Promise.resolve([]),
  searchParams
 ]);
 const active=groups.filter(g=>g.active).length;
 const memberCount=groups.reduce((count,g)=>count+g.members.filter(m=>m.active).length,0);
 const meetingCount=groups.reduce((count,g)=>count+g.meetings.length,0);
 return <div className="space-y-7">
  <div><p className="eyebrow mb-3">Fase 3 • Comunidade</p><h1 className="text-3xl sm:text-4xl font-semibold">Grupos de Crescimento</h1>
   <p className="muted mt-3">Organize GCs, acompanhe participantes e registre encontros e presenças.</p>
  </div>
  {query.success&&<p role="status" className="text-green-800 panel">Operação realizada com sucesso.</p>}
  {query.error&&<p role="alert" className="text-red-800 panel">Não foi possível concluir ({query.error.replaceAll("_"," ")}).</p>}
  <div className="grid grid-cols-3 gap-3">
   <div className="panel"><House className="text-[#8b7959]"/><p className="text-2xl sm:text-3xl font-semibold mt-4">{active}</p><p className="muted text-xs mt-2">GCs ativos</p></div>
   <div className="panel"><UsersRound className="text-[#8b7959]"/><p className="text-2xl sm:text-3xl font-semibold mt-4">{memberCount}</p><p className="muted text-xs mt-2">Vínculos ativos</p></div>
   <div className="panel"><CalendarDays className="text-[#8b7959]"/><p className="text-2xl sm:text-3xl font-semibold mt-4">{meetingCount}</p><p className="muted text-xs mt-2">Últimos encontros exibidos</p></div>
  </div>
  {admin&&<section className="panel space-y-4"><h2 className="text-xl font-semibold">Cadastrar novo GC</h2>
   <p className="muted text-sm">A liderança deve ter cadastro de pessoa vinculado a uma conta ativa com perfil Líder de GC.</p>
   <form action={createGroup} className="grid sm:grid-cols-2 gap-3">
    <label className="text-sm">Nome do GC<input name="name" required minLength={2} maxLength={120} className="input mt-1" placeholder="Ex.: GC Esperança"/></label>
    <label className="text-sm">Líder<select name="leaderId" required defaultValue="" className="input mt-1"><option value="">Selecione</option>{leaders.map(p=><option key={p.id} value={p.id}>{p.fullName}</option>)}</select></label>
    <label className="text-sm">Local de reunião<input name="location" maxLength={160} className="input mt-1" placeholder="Opcional"/></label>
    <label className="text-sm">Dia da semana<select name="meetingDay" defaultValue="3" className="input mt-1">{gcDays.map((d,i)=><option value={i} key={d}>{d}</option>)}</select></label>
    <label className="text-sm">Horário habitual<input type="time" name="meetingTime" required defaultValue="19:30" className="input mt-1"/></label>
    <button className="btn sm:self-end">Cadastrar GC</button>
   </form>
  </section>}
  {groups.length===0&&<section className="panel muted text-sm">{admin?"Nenhum GC cadastrado. Cadastre o primeiro grupo acima.":"Você ainda não está vinculado como líder de um GC nesta igreja."}</section>}
  {groups.map(group=><section className="panel space-y-5" key={group.id}>
   <div className="flex flex-wrap justify-between items-start gap-3">
    <div><p className="eyebrow">Grupo de Crescimento</p><h2 className="text-2xl font-semibold mt-2">{group.name}</h2>
     <p className="muted text-sm mt-2">Liderança: {group.leader.fullName}</p>
     <p className="muted text-sm mt-1">{gcDays[group.meetingDay]} às {group.meetingTime}{group.location?" • "+group.location:""}</p>
     <p className="text-xs mt-2 font-semibold">{group.active?"Ativo":"Inativo"}</p>
    </div>
    {admin&&<form action={setGroupActive}><input type="hidden" name="groupId" value={group.id}/>
     <input type="hidden" name="active" value={String(!group.active)}/>
     <button className="rounded-lg border px-3 py-2 text-sm">{group.active?"Desativar GC":"Reativar GC"}</button>
    </form>}
   </div>
   <div className="grid lg:grid-cols-2 gap-5">
    <div className="space-y-4">
     <h3 className="font-semibold">Participantes ({group.members.filter(m=>m.active).length})</h3>
     {group.active&&<form action={addGroupMember} className="flex flex-wrap gap-2">
      <input type="hidden" name="groupId" value={group.id}/>
      <label className="sr-only" htmlFor={"gc-person-"+group.id}>Pessoa</label>
      <select className="input flex-1 min-w-40" id={"gc-person-"+group.id} name="personId" defaultValue="" required>
       <option value="">Selecionar pessoa</option>{people.filter(p=>!group.members.some(m=>m.personId===p.id&&m.active)).map(p=><option key={p.id} value={p.id}>{p.fullName}</option>)}
      </select><button className="btn">Adicionar</button>
     </form>}
     <div className="space-y-2">{group.members.map(m=><div key={m.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#f7f6f3] p-3">
      <div><p className="text-sm font-medium">{m.person.fullName}</p><p className="muted text-xs">{m.active?"Participante ativo":"Inativo"}</p></div>
      {group.active&&<form action={setGroupMemberActive}><input type="hidden" name="memberId" value={m.id}/><input type="hidden" name="active" value={String(!m.active)}/>
       <button className="text-xs underline underline-offset-4">{m.active?"Desativar":"Reativar"}</button>
      </form>}
     </div>)}</div>
    </div>
    <div className="space-y-4">
     <h3 className="font-semibold">Encontros e presenças</h3>
     {group.active&&<form action={createMeeting} className="space-y-2">
      <input type="hidden" name="groupId" value={group.id}/>
      <label className="block text-sm">Início<input type="datetime-local" name="startsAt" className="input mt-1" required/></label>
      <label className="block text-sm">Tema (opcional)<input name="theme" className="input mt-1" maxLength={160}/></label>
      <button className="btn">Registrar encontro</button>
     </form>}
     {group.meetings.length===0&&<p className="muted text-sm">Nenhum encontro registrado.</p>}
     <div className="space-y-4">{group.meetings.map(meeting=><article key={meeting.id} className="border-t border-[#e5e2dc] pt-3 space-y-3">
      <div><p className="font-semibold text-sm">{dateTimeBR(meeting.startsAt)}</p>{meeting.theme&&<p className="muted text-xs mt-1">{meeting.theme}</p>}</div>
      <p className="muted text-xs">Presentes: {meeting.attendances.filter(a=>a.status==="PRESENTE").length} / {group.members.filter(m=>m.active).length} participantes ativos</p>
      <div className="space-y-2">{group.members.filter(m=>m.active).map(member=>{
       const attendance=meeting.attendances.find(a=>a.memberId===member.id);
       return <form key={member.id} action={markAttendance} className="flex flex-wrap items-center justify-between gap-2">
        <input type="hidden" name="meetingId" value={meeting.id}/><input type="hidden" name="memberId" value={member.id}/>
        <span className="text-xs font-medium">{member.person.fullName} {attendance?"• "+label[attendance.status]:"• Não registrado"}</span>
        <div className="flex gap-1">{(["PRESENTE","AUSENTE","JUSTIFICADO"] as const).map(status=>
         <button name="status" value={status} key={status} aria-label={label[status]+" — "+member.person.fullName}
          className={"px-2 py-1 text-[11px] border rounded-lg "+(attendance?.status===status?"bg-[#22221f] text-white":"")}>{label[status]}</button>
        )}</div>
       </form>;
      })}</div>
     </article>)}</div>
    </div>
   </div>
  </section>)}
 </div>;
}
