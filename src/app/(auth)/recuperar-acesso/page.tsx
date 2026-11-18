import Link from "next/link";
export const metadata={title:"Recuperar acesso | Lagoinha Gestão"};
export default function RecoveryInfo(){
 return <main className="min-h-screen flex items-center justify-center p-6"><section className="panel max-w-lg space-y-5">
  <p className="eyebrow">Recuperação de acesso</p><h1 className="text-3xl font-semibold">Esqueceu sua senha?</h1>
  <p className="muted text-sm leading-6">Por enquanto, a recuperação é feita pela administração da igreja. Solicite um link de redefinição ao responsável pelos usuários. Ele poderá gerar um link individual, válido por 30 minutos.</p>
  <p className="text-xs muted">Não solicitamos sua senha por mensagem. Não compartilhe links de recuperação em grupos.</p>
  <Link href="/login" className="btn inline-block">Voltar ao login</Link>
 </section></main>;
}
