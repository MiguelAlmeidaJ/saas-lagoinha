# Lagoinha Gestão

Sistema de gestão da Lagoinha Além Paraíba — **Next.js + TypeScript + PostgreSQL + Prisma + Docker**.

Desenvolvimento: branch `create`. Implantação: infraestrutura própria, sem Supabase ou Vercel.

## Requisitos

- Node.js 22+
- Docker com Docker Compose v2

## Início rápido (aplicação e Postgres em Docker)

```bash
cp .env.example .env
# EDITE .env: defina uma senha forte em POSTGRES_PASSWORD
docker compose up --build -d
# Para criar o primeiro usuário admin, rode o seed uma vez:
docker compose exec -e ADMIN_EMAIL=admin@exemplo.com -e ADMIN_PASSWORD='SENHA-FORTE-AQUI' app npm run db:seed
```

Acesse http://localhost:3000. Docker executa `prisma migrate deploy` ao iniciar a aplicação.

**Atenção:** troque o email e a senha de exemplo. Não salve credenciais no Git.

## Desenvolvimento Node local + banco em Docker

```bash
cp .env.example .env
# Ajuste POSTGRES_PASSWORD e DATABASE_URL para refletir a mesma senha
docker compose up -d db
npm install
npm run db:generate
npm run db:deploy
ADMIN_EMAIL=admin@exemplo.com ADMIN_PASSWORD='SENHA-FORTE-AQUI' npm run db:seed
npm run dev
```

É importante que a senha de `DATABASE_URL` esteja codificada para URL se possuir caracteres especiais.

## Banco e permissões

O schema está em `prisma/schema.prisma`; migrações versionadas em `prisma/migrations`.
- Church, User, Membership, Session, Person, Ministry, AuditLog.
- Sessões opacas armazenadas no PostgreSQL por hash SHA-256; cookie HttpOnly SameSite=Lax.
- Senhas com bcrypt (12 rounds).
- Todas as queries de pessoas/ministérios filtram `churchId` autenticado.
- Criação de pessoas/ministérios disponível para ADMIN/PASTOR; leitura de pessoas para ADMIN/PASTOR/COORDENADOR.
- Cadastro de usuários restrito ao seed nesta etapa. Convites e gestão de perfis virão depois.

**Antes do servidor público:** implantar HTTPS com proxy reverso, backups automatizados, regras de firewall, rate limit de login, testes automatizados de autorização e recuperação de senha. O PostgreSQL já está mapeado exclusivamente em `127.0.0.1` na máquina.

## Próximas etapas

Confirmar identidade visual oficial, finalizar convites/gestão de usuários e executar testes antes de usar dados pessoais reais.
