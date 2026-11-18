"use client";
import { useMemo, useState } from "react";
import { assignPerson, replaceVolunteer } from "@/app/(app)/escalas/actions";
type EventOption = { id:string; title:string; ministryId:string; when:string };
type TeamOption = { id:string; personId:string; ministryId:string; personName:string };
type FunctionOption = { id:string; ministryId:string; name:string };
export function AssignmentForm({events,team,functions}:{
 events:EventOption[];team:TeamOption[];functions:FunctionOption[];
}) {
 const [eventId,setEventId]=useState("");
 const selected=events.find(e=>e.id===eventId);
 const people=useMemo(()=>team.filter(t=>t.ministryId===selected?.ministryId),[team,selected?.ministryId]);
 const availableFunctions=functions.filter(f=>f.ministryId===selected?.ministryId);
 return <form action={assignPerson} className="space-y-3">
  <label className="block text-sm">Evento
   <select name="eventId" required className="input mt-1" value={eventId} onChange={e=>setEventId(e.target.value)}>
    <option value="">Selecione um evento</option>{events.map(e=><option key={e.id} value={e.id}>{e.title} — {e.when}</option>)}
   </select>
  </label>
  <label className="block text-sm">Voluntário da equipe
   <select key={eventId+"person"} name="personId" required disabled={!eventId} className="input mt-1" defaultValue="">
    <option value="">Selecione</option>{people.map(p=><option key={p.id} value={p.personId}>{p.personName}</option>)}
   </select>
  </label>
  <label className="block text-sm">Função
   <select key={eventId+"function"} name="functionId" disabled={!eventId} className="input mt-1" defaultValue="">
    <option value="">Sem função específica</option>{availableFunctions.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
   </select>
  </label>
  <p className="muted text-xs">As opções são filtradas pelo ministério do evento. O servidor também valida os vínculos e conflitos.</p>
  <button className="btn" disabled={!eventId||people.length===0}>Adicionar à escala</button>
 </form>;
}
export function ReplacementForm({assignmentId,ministryId,currentPersonId,team}:{
 assignmentId:string; ministryId:string;currentPersonId:string;team:TeamOption[];
}){
 const people=team.filter(t=>t.ministryId===ministryId&&t.personId!==currentPersonId);
 return <form action={replaceVolunteer} className="flex items-center gap-2 flex-wrap">
   <input type="hidden" name="assignmentId" value={assignmentId}/>
   <label className="sr-only" htmlFor={"replacement-"+assignmentId}>Substituto</label>
   <select id={"replacement-"+assignmentId} name="personId" required defaultValue="" className="input max-w-52 text-xs">
     <option value="">Selecionar substituto</option>
     {people.map(p=><option key={p.id} value={p.personId}>{p.personName}</option>)}
   </select>
   <button type="submit" disabled={!people.length} className="text-xs border rounded-lg px-3 py-2 font-semibold">Substituir</button>
 </form>;
}
