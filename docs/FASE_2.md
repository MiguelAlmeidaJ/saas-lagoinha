# Fase 2 — Voluntários e Escalas

## Entregas já implementadas
- Equipes, funções, cultos e escalas por ministério
- Confirmação, recusa e indisponibilidades
- Calendário mensal, seleção filtrada e recorrência semanal inicial
- Solicitações de substituição e decisões de líderes autorizados
- Permissões por ministério para coordenadores e trilha de auditoria

## Incremento: área do voluntário
- [x] Nova rota `/minhas-escalas` com interface responsiva
- [x] Saudação pessoal, indicadores e próximo evento
- [x] Escalas futuras restritas ao cadastro associado ao usuário autenticado
- [x] Confirmação e recusa sem acesso administrativo
- [x] Solicitação e cancelamento de troca
- [x] Registro e consulta de indisponibilidades
- [x] Histórico recente de solicitações
- [x] Navegação separada de ferramentas administrativas

## Pendências de validação
- Testar login e navegação em dispositivo real
- Testar o fluxo completo de trocas com múltiplos perfis
- Testar regras de autorização e privacidade com duas igrejas
- Melhorar o cadastro/convite e vínculo entre usuário e pessoa
- Fortalecer proteção contra concorrência e rate limit
- Validar funcionamento dos contêineres localmente antes de usar dados reais

**Decisão de projeto:** testes locais adiados a pedido do responsável. CI segue automatizado. Nenhum deploy em servidor próprio nesta etapa.

## Próxima evolução — usuários e convites

- Administração em /usuarios para ADMIN/PASTOR
- Convites individuais a pessoas sem conta
- Token aleatório, hash em banco, uso único e validade de 48h
- Fluxo público de ativação em /ativar/[token]
- Senha inicial escolhida pela pessoa e armazenada como bcrypt
- Associação transacional de User, Membership e Person
- Revogação de convites e registro de auditoria
- Gestão de convites sem provedor externo de e-mail: cópia manual da URL
- Teste de persistência no GitHub Actions
- Limitações e proteções detalhadas em docs/CONVITES.md

## Incremento — proteção de acesso e recuperação de senha
- [x] Limite por e-mail: 5 falhas / 15 minutos, contador persistente no PostgreSQL
- [x] Erros de login genéricos
- [x] Recuperação por link individual emitido por administração autorizada
- [x] Token somente como hash, uso único, validade de 30 minutos
- [x] Revogação de links anteriores e invalidação de sessões depois da troca de senha
- [x] Teste de persistência e restrições no GitHub Actions
- [ ] Rate limiting de borda/IP e revisão de concorrência
- [ ] Recuperação por e-mail com verificação de posse
- [ ] Testes E2E com sessões reais, troca de perfil e dois tenants
- [ ] Validação do Docker local e servidor antes de dados reais

**Situação:** Fase 2 funcionalmente extensa, mas ainda em desenvolvimento; não encerrar como concluída/validada até revisar os fluxos e a segurança.

## Incremento final — auditoria de autorização e isolamento (18/11/2026)

- [x] Testes automatizados para matriz de papéis (ADMIN, PASTOR, COORDENADOR, MEMBRO e VOLUNTARIO)
- [x] Coordenador limitado aos ministérios explicitamente concedidos
- [x] Vínculo obsoleto perde efeito se o usuário perde o papel ou é desativado
- [x] FKs compostas impedem vincular equipe ou coordenador a ministério de outra igreja
- [x] Consulta por igreja não revela vínculo de outra igreja
- [x] Correção da instrução de advisory lock no controle de tentativas de login
- [ ] Testes HTTP/E2E com sessão e ações reais dos diferentes perfis
- [ ] Defesa completa contra operações simultâneas de atribuição e troca
- [ ] Teste local no Docker, homologação da interface e revisão de deploy

**Não marcar Fase 2 como validada para produção até realizar os itens pendentes.** O desenvolvimento funcional pode ser considerado avançado, mas testes locais continuam adiados conforme solicitação.

## Transição para Fase 3
Em 18/11/2026, foi autorizado iniciar a Fase 3. O último CI da Fase 2 passou, porém o encerramento para produção permanece condicionado a testes locais, E2E, concorrência e homologação. Essas pendências não bloqueiam a implementação de módulos novos.
