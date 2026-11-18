# Lagoinha Gestão

Plataforma de gestão ministerial da **Lagoinha Além Paraíba**.

> Grande para servir, pequena para se importar.

## Fase 1 — Fundação

- Next.js App Router, TypeScript e Tailwind CSS.
- Interface responsiva inspirada na comunicação institucional da igreja.
- Login com Supabase Auth, páginas protegidas e encerramento de sessão.
- Dashboard com números reais do banco (sem dados fictícios).
- Cadastro e listagem de pessoas e ministérios.
- PostgreSQL com isolamento por igreja, políticas RLS e trilha de auditoria.
- Preparação para os módulos Escalas, GCs, Financeiro e Pastoral.

## Executar localmente

Requisitos: Node.js 20+ e um projeto Supabase.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no `.env.local`.

No Supabase SQL Editor, execute `supabase/migrations/0001_foundation.sql`. Desative o cadastro público de usuários no painel Auth até implementar convites.

### Primeiro administrador

1. Crie um usuário no painel Supabase Authentication (ou convide-o).
2. Encontre seu UUID em Authentication > Users.
3. No SQL Editor, substitua `SEU_AUTH_USER_UUID` e execute:

```sql
insert into public.profiles (id, display_name)
values ('SEU_AUTH_USER_UUID', 'Administrador')
on conflict (id) do update set display_name = excluded.display_name;

insert into public.church_memberships (church_id, user_id, role)
select id, 'SEU_AUTH_USER_UUID', 'admin'
from public.churches where slug = 'lagoinha-alem-paraiba'
on conflict (church_id, user_id) do update set role = excluded.role;
```

Acesse `http://localhost:3000/login` com esse usuário.

**Nunca inclua chaves secretas / service_role no frontend ou no Git.** A chave publishable/anon funciona exclusivamente com RLS corretamente aplicada.

## Estrutura

- `src/app/(auth)/login`: autenticação.
- `src/app/(app)`: área protegida.
- `src/lib/supabase`: clientes SSR e sessão.
- `src/components`: navegação e elementos reutilizáveis.
- `supabase/migrations`: modelo de dados, políticas e auditoria.

## Segurança

Este projeto lida com dados pessoais potencialmente sensíveis. As políticas do banco restringem acesso por vínculo e papel; não armazene anotações pastorais confidenciais nesta fase. Não habilite cadastros públicos antes do fluxo de aprovação/convites.

## Próximas etapas

1. Validar marca (cores e arquivos de logo oficiais).
2. Configurar Supabase e Vercel com variáveis por ambiente.
3. Criar fluxo de convites, edição de usuários, testes E2E e CI.
4. Iniciar módulo Voluntários e Escalas.

Código da fase inicial na branch `create`. Não foi feito deploy automático.
