import Link from "next/link";
import { LayoutDashboard, UsersRound, HandHeart, CalendarDays, House, Wallet, HeartHandshake, Settings, LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";
const items = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard, active: true },
  { href: "/pessoas", label: "Pessoas", icon: UsersRound, active: true },
  { href: "/ministerios", label: "Ministérios", icon: HandHeart, active: true },
  { href: "#", label: "Escalas", icon: CalendarDays, active: false },
  { href: "#", label: "Grupos de crescimento", icon: House, active: false },
  { href: "#", label: "Financeiro", icon: Wallet, active: false },
  { href: "#", label: "Pastoral", icon: HeartHandshake, active: false },
  { href: "#", label: "Configurações", icon: Settings, active: false },
];
export function Sidebar({ role }: { role: string }) {
 return <aside className="w-full lg:w-[256px] shrink-0 bg-[#22221f] text-white flex flex-col lg:min-h-screen">
   <div className="px-6 py-8 border-b border-white/10"><span className="text-sm tracking-[.18em] font-bold">LAGOINHA</span><span className="block text-[#c4ac7c] tracking-wider text-[11px] mt-1">ALÉM PARAÍBA</span><span className="block text-white/40 text-xs mt-5">PAINEL DE GESTÃO</span></div>
   <nav aria-label="Menu principal" className="p-3 space-y-1 flex-1">
     {items.map(({ href, label, icon: Icon, active }) => active
      ? <Link key={label} href={href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white text-sm"><Icon size={18}/>{label}</Link>
      : <div key={label} title="Disponível em uma próxima fase" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/35 text-sm cursor-not-allowed"><Icon size={18}/>{label}<span className="ml-auto text-[9px]">EM BREVE</span></div>)}
   </nav>
   <div className="p-5 border-t border-white/10"><p className="text-white/40 text-xs mb-3">Perfil: {role.replace("_", " ")}</p><form action={logout}><button className="flex items-center gap-2 text-white/80 hover:text-white text-sm"><LogOut size={16}/> Sair</button></form></div>
 </aside>;
}
