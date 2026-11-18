import Link from "next/link";
import { UsersRound, HandHeart, House, CalendarDays, ArrowUpRight } from "lucide-react";
import { requireAccess } from "@/lib/auth";
export default async function Dashboard() {
  const { supabase, churchId } = await requireAccess();
  const [people, ministries] = await Promise.all([
    supabase.from("people").select("*", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("ministries").select("*", { count: "exact", head: true }).eq("church_id", churchId)
  ]);
  const stats = [
    { label: "Pessoas cadastradas", value: people.count ?? 0, icon: UsersRound, href: "/pessoas" },
    { label: "Ministérios", value: ministries.count ?? 0, icon: HandHeart, href: "/ministerios" },
    { label: "GCs ativos", value: "Em breve", icon: House, href: "#" },
    { label: "Escalas", value: "Em breve", icon: CalendarDays, href: "#" }
  ];
  return <div>
    <p className="eyebrow mb-3">Visão geral</p><h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Bem-vindo ao Lagoinha Gestão.</h1>
    <p className="muted mt-3 mb-10">Uma forma mais simples de servir e cuidar das pessoas.</p>
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{stats.map(({label,value,icon:Icon,href})=><Link href={href} key={label} className="panel hover:border-[#c4ac7c] transition-colors"><div className="flex justify-between"><span className="rounded-xl bg-[#f4f0e8] p-3 text-[#8b7959]"><Icon size={20}/></span><ArrowUpRight size={16} className="text-[#bdb9b1]"/></div><div className="text-3xl font-semibold mt-8">{value}</div><p className="muted text-sm mt-2">{label}</p></Link>)}</div>
    <div className="grid lg:grid-cols-2 gap-5 mt-7">
      <section className="panel"><p className="eyebrow mb-3">Comece por aqui</p><h2 className="text-xl font-semibold mb-3">Organize sua comunidade</h2><p className="muted text-sm leading-6 mb-6">Cadastre as pessoas e os ministérios. Essas informações serão a base para escalas, GCs e os próximos módulos.</p><div className="flex flex-wrap gap-3"><Link href="/pessoas" className="btn">Ver pessoas</Link><Link href="/ministerios" className="rounded-xl border border-[#e5e2dc] px-4 py-3 text-sm font-semibold">Ministérios</Link></div></section>
      <section className="panel bg-[#292821] text-white"><p className="text-[#c4ac7c] text-xs font-semibold tracking-[.18em] uppercase mb-4">Nossa essência</p><p className="text-2xl font-medium leading-snug">“Grande para servir, pequena para se importar.”</p><p className="text-white/55 text-sm mt-6">Uma gestão que serve às pessoas, não o contrário.</p></section>
    </div>
  </div>;
}
