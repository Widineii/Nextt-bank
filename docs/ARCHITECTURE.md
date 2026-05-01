# Arquitetura Nexttt Bank

## Camadas

- `index.html`, `styles.css`, `app.js`: app web hibrido/PWA para celular, notebook e PC.
- `server.js`: API local sem dependencias externas para facilitar execucao inicial.
- `src/db`: camada de persistencia com JSON ativo e adaptador PostgreSQL preparado.
- `data/nextt-db.json`: banco local de desenvolvimento, criado automaticamente.
- `docs/schema.sql` e `docs/migrations`: desenho para migracao futura para PostgreSQL.
- `Dockerfile` e `docker-compose.yml`: preparo de nuvem.

## Fluxos principais

1. Login com senha protegida por PBKDF2.
2. Sessao por token com expiracao.
3. Cadastro de cliente.
4. Abertura de conta com CPF, dados pessoais e status de analise.
5. Operacoes: deposito, saque, transferencia e PIX simulado.
6. Relatorios: resumo na tela e exportacao CSV.
7. Admin: usuarios, auditoria, bloqueios e volume de operacoes.

## Producao futura

- Substituir JSON por PostgreSQL.
- Usar HTTPS obrigatorio.
- Guardar tokens em cookie HttpOnly.
- Ativar 2FA real.
- Criar testes automatizados de API com ambiente isolado.
- Adicionar logs estruturados e monitoramento.
