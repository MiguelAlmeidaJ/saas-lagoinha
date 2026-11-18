# Fase 2 — Voluntários e escalas

## Implementação inicial na branch create

- Cadastro de equipes por ministério (vínculo Pessoa x Ministério)
- Cadastro de funções de serviço
- Cultos e eventos com data/hora, local e ministério responsável
- Escala individual com status pendente, confirmada ou recusada
- Detecção inicial de conflito de horário e indisponibilidade
- Indisponibilidade da pessoa vinculada ao usuário
- Confirmação ou recusa da escala pela conta vinculada
- Registro de auditoria das principais operações
- Filtragem por igreja em queries e chaves estrangeiras compostas
- Página /escalas responsiva

## Limitações e próximos incrementos

- [ ] Testes de build/Prisma migration e fluxos E2E
- [ ] Onboarding/convites e vínculo de conta mais amigável
- [ ] Filtro dependente por ministério no formulário de escala
- [ ] Reforçar exclusividade de escalas concorrentes em transações simultâneas
- [ ] Edição/cancelamento e substituição de escalas
- [ ] Escalas recorrentes, notificações por WhatsApp, sugestões inteligentes
- [ ] Gestão granular dos coordenadores por ministério
- [ ] Refinar autorização da visualização de eventos e privacidade
- [ ] Reavaliar fusos horários para operações fora de Brasília

Os testes locais de Docker foram adiados a pedido do responsável. Não marcar a fase como validada.
