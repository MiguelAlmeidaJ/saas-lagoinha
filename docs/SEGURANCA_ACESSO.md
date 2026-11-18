# Segurança da conta — incremento da Fase 2

## Login
- Contador por hash SHA-256 do e-mail normalizado, armazenado no PostgreSQL (sem e-mail em texto puro na tabela de bloqueios).
- Após 5 falhas em uma janela de 15 minutos, aplica bloqueio por 15 minutos.
- Retorna erro genérico para credenciais erradas e bloqueio, evitando confirmar a existência da conta.
- Remove o bloqueio depois de autenticação válida e redefinição de senha.
- Limitação por e-mail não substitui limitação por endereço IP, observabilidade e proteção de borda. Um atacante ainda pode bloquear temporariamente uma conta conhecida.

## Recuperação
- Sem SMTP nesta fase: o responsável ADMIN/PASTOR gera link individual em /usuarios e compartilha em privado.
- Link de 32 bytes aleatórios, hash SHA-256 no banco, uso único, expiração em 30 minutos; reemissão revoga os anteriores.
- O administrador não escolhe a senha do usuário. O destinatário define senha com 12 a 128 caracteres.
- A conclusão invalida todas as sessões existentes do usuário e revoga tokens anteriores.
- Registra emissões e uso na auditoria.
- PASTOR só pode emitir para perfis MEMBRO, VOLUNTARIO, LIDER_GC e COORDENADOR.
- 20 links por administrador em 24 horas (limitação lógica).
- Não utilizar links com dados reais antes de disponibilizar HTTPS no servidor final.

## Antes de produção
- Rate limiting global e por IP em proxy confiável, revisão de concorrência e testes de sessão.
- Confirmação da posse do e-mail via provedor de e-mail ou canal de identidade verificado.
- Testes E2E e revisão de isolamento de igrejas, backups e segurança de logs.
