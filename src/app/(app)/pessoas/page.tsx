import { requireAccess, canManage } from "@/lib/auth";
import { createPerson } from "./actions";
export default async function PeoplePage({ searchParams }: { searchParams: Promise<{error?:string,success?:string}> }) {
  const { supabase, churchId, role } = await requireAccess();
  const [{ data: people, error }, query] = await Promise.all([
    supabase.from("people").select("id,full_name,email,phone,created_at").eq("church_id",churchId).order("full_name").limit(100),
    searchParams
  ]);
  return <div><p className="eyebrow mb-3">Cadastro único</p><h1 className="text-4xl font-semibold">Pessoas</h1><p className="muted mt-3 mb-8">A base da nossa comunidade. Até 100 registros exibidos nesta etapa.</p>
   {query.success && <p role="status" className="text-green-800 mb-5">Pessoa cadastrada com sucesso.</p>}
   {query.error && <p role="alert" className="text-red-800 mb-5">Não foi possível concluir a operação ({query.error}).</p>}
   {error && <p role="alert" className="text-red-800 mb-5">Falha ao carregar pessoas.</p>}
   {canManage(role) && <section className="panel mb-6"><h2 className="font-semibold text-lg mb-5">Nova pessoa</h2><form action={createPerson} className="grid md:grid-cols-4 gap-3"><input className="input md:col-span-2" aria-label="Nome completo" name="full_name" placeholder="Nome completo *" minLength={2} maxLength={160} required/><input className="input" type="email" aria-label="E-mail" name="email" placeholder="E-mail"/><input className="input" aria-label="Telefone" name="phone" placeholder="Telefone" maxLength={30}/><button className="btn md:col-span-4">Cadastrar pessoa</button></form></section>}
   <section className="panel"><h2 className="font-semibold mb-4">Pessoas cadastradas</h2><div className="table-wrap"><table className="table"><thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th></tr></thead><tbody>{(people??[]).map(p=><tr key={p.id}><td className="font-medium">{p.full_name}</td><td>{p.email??"—"}</td><td>{p.phone??"—"}</td></tr>)}</tbody></table></div>{!people?.length && !error && <p className="muted text-sm py-5">Nenhuma pessoa cadastrada ainda.</p>}</section>
  </div>;
}
