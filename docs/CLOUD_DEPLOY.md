# Deploy em nuvem

## Caminho rapido com Docker

1. Instale Docker Desktop.
2. Rode:

```bash
docker compose up --build
```

3. Abra:

```text
http://localhost:3000
```

## PostgreSQL

O `docker-compose.yml` ja sobe um PostgreSQL local em:

```text
postgres://nextt:nextt@localhost:5432/nextt_bank
```

O arquivo `schema.sql` contem as tabelas para migrar o banco JSON para PostgreSQL.

Migrations preparadas:

```text
docs/migrations/001_initial_schema.sql
docs/migrations/002_seed_demo.sql
```

## CI/CD

O projeto inclui GitHub Actions em:

```text
.github/workflows/ci.yml
```

Ele roda:

```bash
npm test
npm run test:api
npm run test:e2e
```

## Producao

- Use HTTPS obrigatorio.
- Troque `POSTGRES_PASSWORD`.
- Configure backup diario.
- Use variaveis de ambiente reais.
- Ative logs e monitoramento.
- Use dominio proprio apontando para o provedor.
- Configure `Secure` nos cookies quando estiver atras de HTTPS.
- Substitua o adaptador JSON por acesso PostgreSQL usando `schema.sql`.
