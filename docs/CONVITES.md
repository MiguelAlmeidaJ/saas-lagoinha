# Convites de acesso — Lagoinha Gestão

Acesse /usuarios com perfil ADMIN ou PASTOR. O gestor seleciona uma pessoa cadastrada sem conta, informa o e-mail e o papel, e gera um convite individual. A URL é exibida uma única vez, deve ser compartilhada privadamente e expira em 48 horas. Não há envio de e-mail automático.

O token secreto tem 32 bytes aleatórios e só seu hash SHA-256 fica no PostgreSQL. O primeiro uso válido cria User, Membership e associa Person, de modo transacional. O token expira, pode ser revogado e não pode ser reutilizado. Apenas ADMIN pode convidar para ADMIN, PASTOR ou FINANCEIRO. O pastor pode convidar para MEMBRO, VOLUNTARIO, COORDENADOR ou LIDER_GC.

**Limitações intencionais desta entrega:**
- Convites são para contas novas, não para vincular e-mails que já possuem conta.
- O link constitui uma credencial temporária: compartilhe-o por canal privado. A ativação não verifica posse do e-mail em separado.
- O formulário de convite permite no máximo 30 convites por administrador a cada 24 horas (limitação lógica; faltam controles globais contra concorrência).
- Ainda é preciso implementar rate limit de login e da ativação, recuperação de senha e integração de e-mail antes do uso em produção.
- As ações de revogar e convidar exigem autenticação e autorização no servidor. Atribuições de coordenadores por ministério continuam uma etapa separada.
- Não compartilhar o token em logs, capturas públicas, histórico de issues ou ferramentas de monitoramento.
- A permissão multi-igreja ainda precisa de uma política explícita para contas com mais de um vínculo.

Os testes locais de Docker continuam adiados conforme combinado. O CI verifica Prisma, TypeScript, lint, build e o banco de testes.
