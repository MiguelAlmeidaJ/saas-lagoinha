# Fase 3 — Grupos de Crescimento (GCs)

## Primeiro incremento
- [x] Cadastro de GCs: nome, líder, local, dia e horário habitual
- [x] Líder vinculado ao cadastro de pessoa e conta ativa com papel LIDER_GC
- [x] Inclusão, reativação e desativação de participantes
- [x] Registro de encontros por data e tema opcional
- [x] Presença, ausência e justificativa para participantes ativos
- [x] Painel de GC com indicadores básicos
- [x] Acesso restrito a ADMIN, PASTOR e LIDER_GC
- [x] Líder visualiza e gerencia somente GCs próprios; administração visualiza todos
- [x] Operações auditadas; integridade por chaves estrangeiras compostas com churchId
- [x] Smoke test PostgreSQL na pipeline do GitHub Actions

## Regras e limites
- Pessoas são reutilizadas do cadastro da igreja. Líder requer conta ativa e papel LIDER_GC.
- Participante pode estar em mais de um GC neste estágio; o produto ainda não tem política para isso.
- Participação e presença não são informações públicas.
- Troca de líder e histórico de transferência de participantes ainda não implementados.
- O vínculo entre presença e grupo da reunião é checado na server action; a restrição composta entre grupos será endurecida antes da produção.
- A contagem de participantes é de vínculos ativos, não de pessoas únicas entre GCs.
- Nenhum registro de acompanhamento pastoral sensível será armazenado neste incremento.

## Próximas evoluções
1. Presenças por período, relatórios simples e exportação protegida.
2. Transferência de participantes e edição de líderes com histórico.
3. Reuniões recorrentes, taxas de participação e acompanhamento não sensível.
4. Testes de autorização HTTP/E2E, concorrência, isolamento e homologação.

**Nota:** fase 2 tem desenvolvimento funcional avançado e CI aprovado no último commit antes desta fase; homologação local e endurecimento de segurança seguem pendentes. Fase 3 está iniciada e não validada para uso real.
