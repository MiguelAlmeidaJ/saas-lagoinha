import { login } from "./actions";
import Link from "next/link";
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; senha?: string }> }) {
  const { error, senha } = await searchParams;
  return <main className="min-h-screen grid lg:grid-cols-2">
    <section className="hidden lg:flex flex-col justify-between bg-[#22221f] p-14 text-white">
      <div className="text-xl font-bold tracking-wide">LAGOINHA <span className="text-[#c4ac7c]">/</span> ALÉM PARAÍBA</div>
      <div><p className="text-[#c4ac7c] uppercase tracking-[.24em] text-xs mb-5">Um lugar de novos começos</p><h1 className="text-6xl font-semibold tracking-tight leading-[1.07]">Grande para servir,<br/><span className="text-[#c4ac7c]">pequena para se importar.</span></h1><p className="text-white/60 mt-7 max-w-md">Pessoas, ministérios e cuidado em um só lugar.</p></div>
      <p className="text-white/40 text-sm">Lagoinha Gestão • Além Paraíba, MG</p>
    </section>
    <section className="flex items-center justify-center p-7">
      <div className="w-full max-w-md">
        <div className="lg:hidden font-bold mb-12 tracking-wide">LAGOINHA / ALÉM PARAÍBA</div>
        <p className="eyebrow mb-3">Bem-vindo de volta</p><h2 className="text-4xl font-semibold tracking-tight">Acesse sua conta</h2>
        <p className="muted mt-3 mb-9">Entre para administrar a sua comunidade.</p>
        <form action={login} className="space-y-5">
          <div><label htmlFor="email" className="block text-sm font-semibold mb-2">E-mail</label><input className="input" id="email" name="email" type="email" autoComplete="email" required placeholder="seu@email.com"/></div>
          <div><label htmlFor="password" className="block text-sm font-semibold mb-2">Senha</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" required minLength={6} placeholder="Sua senha"/></div>
          {senha==="alterada" && <p role="status" className="text-green-800 text-sm">Senha alterada. Entre novamente.</p>}
          {error && <p role="alert" className="text-red-700 text-sm">Não foi possível entrar. Verifique suas credenciais.</p>}
          <button type="submit" className="btn w-full">Entrar no painel</button>
        </form><p className="text-xs muted mt-8">O acesso é criado por convite individual da administração. Já recebeu um convite? Abra o link enviado a você.</p><p className="text-xs muted mt-4">Acesso restrito a usuários autorizados pela administração da igreja.</p><p className="text-sm mt-5"><Link className="underline underline-offset-4" href="/recuperar-acesso">Esqueci minha senha</Link></p>
      </div>
    </section>
  </main>;
}
