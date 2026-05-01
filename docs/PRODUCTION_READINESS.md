# Production readiness

## Implementado no MVP local

- Headers de seguranca basicos.
- CSP restritiva para assets locais.
- Rate limit em memoria por IP e rota.
- Logs JSON em `data/logs/app.log`.
- Backups manuais com `npm run backup`.
- Sessao com cookie HttpOnly e refresh token.
- Politica de privacidade e termos demonstrativos.
- Smoke test de API.
- GitHub Actions preparado.
- Camada `src/db` com JSON ativo e PostgreSQL preparado.
- Migrations SQL versionadas.

## Para producao real

- Trocar rate limit em memoria por Redis ou equivalente.
- Usar PostgreSQL conectado ao backend.
- Adicionar migrations reais.
- Rodar atras de HTTPS e marcar cookies como `Secure`.
- Usar provedor real de e-mail/SMS.
- Ativar observabilidade externa.
- Criar pipeline CI/CD.
- Rodar pentest e auditoria de seguranca.
