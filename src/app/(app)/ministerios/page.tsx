import { canManage, requireAccess } from "@/lib/auth";
import { createMinistry } from "./actions";
export default async function MinistriesPage({ searchParams }: { searchParams: Promise<{error?:string,success?:string}> }) {
 const { supabase, churchId, role } = await requireAccess();
 const [{data:ministries,error},query] = await Promise.all([supabase.from("ministries").select("id,name,description").eq("church_id",churchId).order("name").limit(100),searchParams]);
 return <div><p className="eyebrow mb-3">Nossa equipe</p><h1 className="text-4xl font-semibold">Ministérios</h1><p className="muted mt-3 mb-8">Organize as áreas de serviço que depois participarão das escalas.</p>
 {query.success && <p role="status" className="text-green-800 mb-5">Ministério cadastrado.</p>}{query.error && <p role="alert" className="text-red-800 mb-5">Erro na operação ({query.error}).</p>}{error && <p role="alert" className="text-red-800 mb-5">Falha ao carregar ministérios.</p>}
 {canManage(role) && <section className="panel mb-6"><h2 className="text-lg font-semibold mb-5">Novo ministério</h2><form action={createMinistry} className="grid md:grid-cols-3 gap-3"><input className="input" aria-label="Nome do ministério" name="name" minLength={2} maxLength={100} required placeholder="Nome do ministério *"/><input className="input md:col-span-2" aria-label="Descrição" name="description" maxLength={500} placeholder="Descrição (opcional)"/><button className="btn md:col-span-3">Cadastrar ministério</button></form></section>}
 <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{ministries?.map(m=><article key={m.id} className="panel"><span className="eyebrow">Ministério</span><h2 className="text-xl font-semibold mt-3">{m.name}</h2><p className="muted text-sm mt-3">{m.description??"Sem descrição"}</p></article>)}</section>{!ministries?.length&&!error&&<p className="panel muted text-sm">Nenhum ministério cadastrado ainda.</p>}
 </div>;
}
