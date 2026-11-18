# Fase 1 — Fundação (PostgreSQL + Prisma + Docker)

## Implementado
- [x] Next.js + TypeScript + Tailwind CSS
- [x] Prisma schema e migration inicial
- [x] Dockerfile e docker-compose com PostgreSQL 16
- [x] Login e logout com sessões no PostgreSQL
- [x] Controles básicos de acesso por papel e igreja
- [x] Dashboard com contagens do banco
- [x] Cadastros de pessoas e ministérios com auditoria de criação
- [x] Seed manual do primeiro administrador
- [x] CI para TypeScript, lint, build e banco PostgreSQL de testes (validar execução)

## Pendente antes de concluir a fase
- [ ] Confirmar sucesso do novo CI com migrações e seed reais
- [ ] Rodar Docker Compose local e validar login/logout, cadastro e reinício com volume persistente
- [ ] Testes de autorização para todos os papéis e duas igrejas
- [ ] Rate limit e proteção contra ataques de senha no login
- [ ] Convites e gestão segura de usuários; redefinição de senha
- [ ] Refinar identidade visual com assets oficiais da igreja
- [ ] Testes E2E de navegação e acessibilidade

## Etapa posterior: servidor próprio
- [ ] HTTPS com reverse proxy
- [ ] Backups testados, monitoramento, atualizações e firewall
