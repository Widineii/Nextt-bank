# Case Study: Nexttt Bank

## Problema

Criar um sistema bancario demonstrativo que pareca confiavel, moderno e tecnicamente preparado para crescer, sem copiar a identidade visual de bancos conhecidos.

## Solucao

O Nexttt Bank foi construido como uma aplicacao web hibrida para celular e desktop, com dashboard premium, operacoes bancarias simuladas, seguranca inicial e backend local.

## Decisoes de design

- Fundo matte charcoal com textura sutil.
- Cards glass com blur, bordas chanfradas e rim lighting turquesa.
- Gradientes teal/ciano para acoes principais.
- Layout serio, limpo e orientado a confianca.
- Navegacao lateral no desktop e tabbar no mobile.

## Decisoes tecnicas

- HTML, CSS e JavaScript para manter o projeto simples de rodar.
- Node.js nativo no backend, sem dependencia obrigatoria.
- Banco JSON para demo local.
- Schema SQL e Docker Compose preparados para PostgreSQL.
- Service worker versionado para evitar cache antigo.
- Testes estruturais e smoke test de API.

## Seguranca

- Hash de senha com PBKDF2 e salt.
- Comparacao segura com `timingSafeEqual`.
- Bloqueio por tentativas erradas.
- Cookie HttpOnly e refresh token.
- Auditoria de eventos sensiveis.
- 2FA e antifraude em modo demonstrativo.

## Telas principais

- Login e cadastro completo.
- Dashboard financeiro.
- Conta e PIX.
- Cartao e fatura.
- Investimentos.
- Emprestimos.
- Admin e auditoria.
- Relatorios e comprovante PDF.

## Proximos passos reais

- Conectar o backend ao PostgreSQL.
- Configurar HTTPS em producao.
- Integrar provedor real de e-mail/SMS.
- Criar KYC real com validacao documental.
- Adicionar testes end-to-end completos.
