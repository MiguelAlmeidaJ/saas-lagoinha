import Link from "next/link";
type CalendarEvent = {id:string;title:string;startsAt:Date;ministry:string;status?:string};
const zone="America/Sao_Paulo";
function parts(d:Date) {
 const p=new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);
 const x=Object.fromEntries(p.map(v=>[v.type,v.value]));
 return x.year+"-"+x.month+"-"+x.day;
}
export function MonthCalendar({month,events}:{month:string;events:CalendarEvent[]}) {
 const [year,m]=month.split("-").map(Number);
 const start=new Date(Date.UTC(year,m-1,1));
 const length=new Date(Date.UTC(year,m,0)).getUTCDate();
 const offset=start.getUTCDay();
 const prev=new Date(Date.UTC(year,m-2,1)).toISOString().slice(0,7);
 const next=new Date(Date.UTC(year,m,1)).toISOString().slice(0,7);
 const title=new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric",timeZone:"UTC"}).format(start);
 const byDay=new Map<string,CalendarEvent[]>();
 for(const e of events) {
  const key=parts(e.startsAt);byDay.set(key,[...(byDay.get(key)??[]),e]);
 }
 return <section className="panel space-y-5">
  <div className="flex justify-between items-center gap-2">
   <div><p className="eyebrow mb-2">Agenda ministerial</p><h2 className="text-xl font-semibold capitalize">{title}</h2></div>
   <div className="flex gap-2 text-sm"><Link className="border rounded-lg px-3 py-2" href={"/escalas?mes="+prev}>Anterior</Link><Link className="border rounded-lg px-3 py-2" href={"/escalas?mes="+next}>Próximo</Link></div>
  </div>
  <div className="grid grid-cols-7 gap-1 text-center text-xs muted">{["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d=><div key={d}>{d}</div>)}</div>
  <div className="grid grid-cols-7 gap-1">
   {Array.from({length:offset},(_,i)=><div key={"gap"+i} aria-hidden="true"/>)}
   {Array.from({length},(_,i)=>{
    const day=i+1;
    const key=month+"-"+String(day).padStart(2,"0");
    const listed=byDay.get(key)??[];
    return <div key={key} className="border rounded-lg min-h-24 p-1 sm:p-2 overflow-hidden">
     <span className="text-xs font-semibold">{day}</span>
     <div className="mt-1 space-y-1">
      {listed.slice(0,3).map(e=><div key={e.id} title={e.title+" • "+e.ministry} className="bg-[#eee8dc] rounded px-1 py-1 text-[10px] truncate">{e.title}</div>)}
      {listed.length>3&&<p className="text-[10px] muted">+{listed.length-3} evento(s)</p>}
     </div>
    </div>;
   })}
  </div>
 </section>;
}
