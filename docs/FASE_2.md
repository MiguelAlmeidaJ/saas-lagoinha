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
