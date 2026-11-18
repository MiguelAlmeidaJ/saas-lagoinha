# Fase 1 — Fundação (PostgreSQL + Prisma + Docker)

## Implementado
- [x] Next.js + TypeScript + Tailwind CSS
- [x] Prisma schema e migration inicial
- [x] Dockerfile e docker-compose com PostgreSQL 16
- [x] Login e logout com sessões no PostgreSQL
- [x] Controles de acesso por papel e igreja
- [x] Dashboard com contagens do banco
- [x] Cadastros de pessoas e ministérios com auditoria de criação
- [x] Seed manual do primeiro administrador

## Pendente antes de uso real
- [ ] Executar npm install, testes de build, migrações e fluxo completo de login em ambiente configurado
- [ ] Implementar rate limiting e recuperação de senha
- [ ] Testar acesso cruzado de igrejas e permissões de todos os perfis
- [ ] Validar identidade visual e assets oficiais
- [ ] Implantar SSL, proxy reverso, backups e monitoramento no servidor próprio
- [ ] Convites, gerenciamento de usuários, edição e exclusão auditada
