# Fase 2 — Voluntários e Escalas

## Incremento de desenvolvimento
- Vínculos de voluntários e funções por ministério
- Eventos com data, local e horário
- Escalas e confirmação/recusa
- Indisponibilidades e validação inicial de conflitos
- Formulário de escala com pessoas/funções filtradas pelo ministério
- Calendário mensal com navegação
- Substituição administrativa de voluntários com auditoria
- Geração de séries de 2 a 8 eventos semanais

## Atenção
A recorrência cria eventos independentes; não edita toda uma série.
A substituição mantém o mesmo registro e reinicia a confirmação. O log identifica o usuário substituído.
O calendário deve mostrar somente dados autorizados ao papel corrente.
Não há execução local de Docker nesta etapa a pedido do responsável.

## Próximos incrementos
- Testes de autorização de todos os papéis e isolamento entre igrejas
- Fluxo de convites, gestão granular de coordenadores e recuperação de senha
- Trocas solicitadas pelo voluntário com aprovação do líder
- Escalas recorrentes com edição da série
- Integração oficial de notificações e confirmação WhatsApp
- Travamento contra concorrência para atribuições simultâneas

## Trocas solicitadas e permissões (incremento 3)

- Voluntário vinculado à conta solicita troca em sua própria escala futura, com motivo opcional
- Apenas um pedido pendente por escala (índice parcial no PostgreSQL)
- Voluntário pode cancelar seu pedido pendente
- Coordenador autorizado por ministério, administrador ou pastor pode aprovar/recusar
- Autoaprovação do próprio solicitante não é permitida
- Aprovação exige substituto ativo no mesmo ministério, sem conflito ou indisponibilidade
- Nova atribuição volta ao estado pendente para confirmação
- Associação de coordenador por ministério concedida ou revogada por admin/pastor
- Auditoria de solicitações, decisões e permissões
- CI agora valida estrutura de trocas e isolamento por chaves estrangeiras compostas

**Pendente**: testes de fluxo HTTP com sessões reais, notificações, revisão de UX no dispositivo e concorrência sob carga. No momento não se exige execução local.
