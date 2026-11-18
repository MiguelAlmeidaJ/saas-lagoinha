import { cancelSwap, decideSwap, requestSwap } from "@/app/(app)/escalas/swap-actions";
export function RequestSwapForm({assignmentId}:{assignmentId:string}) {
 return <form action={requestSwap} className="flex flex-col gap-2 min-w-48">
  <input type="hidden" name="assignmentId" value={assignmentId}/>
  <label className="text-xs" htmlFor={"reason-"+assignmentId}>Pedir substituição</label>
  <input id={"reason-"+assignmentId} name="reason" className="input text-xs" maxLength={500} placeholder="Motivo (opcional)"/>
  <button className="border rounded-lg px-3 py-2 text-xs font-semibold">Solicitar troca</button>
 </form>;
}
export function CancelSwapForm({requestId}:{requestId:string}) {
 return <form action={cancelSwap}><input type="hidden" name="requestId" value={requestId}/>
  <button className="border rounded-lg px-3 py-2 text-xs">Cancelar solicitação</button>
 </form>;
}
export function DecideSwapForm({requestId,team}:{
 requestId:string;team:{id:string;personName:string}[]
}){
 return <div className="flex gap-2 flex-wrap">
  <form action={decideSwap} className="flex gap-2 flex-wrap">
   <input type="hidden" name="requestId" value={requestId}/>
   <input type="hidden" name="decision" value="APROVADA"/>
   <label className="sr-only" htmlFor={"swap-target-"+requestId}>Substituto</label>
   <select id={"swap-target-"+requestId} name="replacementId" className="input max-w-52 text-xs" required defaultValue="">
    <option value="">Novo voluntário</option>{team.map(p=><option key={p.id} value={p.id}>{p.personName}</option>)}
   </select>
   <button disabled={!team.length} className="btn text-xs">Aprovar troca</button>
  </form>
  <form action={decideSwap}>
   <input type="hidden" name="requestId" value={requestId}/>
   <input type="hidden" name="decision" value="RECUSADA"/>
   <button className="border rounded-lg px-3 py-2 text-xs text-red-800">Recusar</button>
  </form>
 </div>;
}
