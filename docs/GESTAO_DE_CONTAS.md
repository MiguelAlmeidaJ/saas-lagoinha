# Gestão de contas — incremento

- `/usuarios`: ADMIN pode alterar perfil e ativar/desativar contas vinculadas à igreja. PASTOR opera somente papéis MEMBRO, VOLUNTARIO, LIDER_GC e COORDENADOR.
- Não é permitido alterar o próprio papel ou desativar a própria conta.
- O último ADMIN ativo da igreja não pode ser desativado nem rebaixado.
- Mudanças de papel e desativação invalidam sessões existentes e geram auditoria.
- Mudança de COORDENADOR para outro papel exclui vínculos de coordenação ministerial.
- Contas com vínculos a mais de uma igreja não podem ser desativadas pelo painel neste estágio.
- `/meu-perfil`: o próprio usuário modifica nome, telefone e senha, com checagem da senha atual. Uma troca de senha encerra todas as sessões.
- Email de login não pode ser alterado na interface até existir fluxo de verificação de posse.
- Controle de acesso ocorre nas server actions, além da navegação.
- Todos os testes locais continuam adiados; GitHub Actions executa as verificações automatizadas.

## Pendente antes de produção

Testes de concorrência na proteção do último admin, autorização E2E, recuperação de senha, limitação de tentativas de login e gerenciamento de contas multi-igreja.
