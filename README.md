# Nexttt Bank - Sistema Bancario Web

![Status](https://img.shields.io/badge/status-portfolio%20ready-55d9f0)
![Stack](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JavaScript%20%7C%20Node.js-55e3bf)
![Responsive](https://img.shields.io/badge/layout-celular%20%7C%20notebook%20%7C%20desktop-55d9f0)

Projeto de portfólio desenvolvido por **Widinei Martins de Oliveira**: um sistema bancario web com interface premium, operacoes financeiras simuladas, autenticacao, painel administrativo, relatorios, auditoria e estrutura preparada para evoluir para nuvem.

> Este projeto e demonstrativo/educacional. Ele simula fluxos bancarios para portfolio e entrevistas, sem conexao com instituicao financeira real.

## Demonstracao

### Login
![Tela de login](images/01-login.png)

### Dashboard desktop
![Dashboard desktop](images/02-dashboard-desktop.png)

### Operacoes bancarias
![Operacoes bancarias](images/03-operacoes-bancarias.png)

### Cartoes
![Cartoes](images/04-cartoes.png)

### Investimentos
![Investimentos](images/05-investimentos.png)

### Painel administrativo
![Painel administrativo](images/06-admin.png)

### Mobile
![Dashboard mobile](images/07-mobile-dashboard.png)

## Funcionalidades

- Login com usuario demo e fallback local para apresentacao.
- Cadastro de cliente demo com validacao basica.
- Dashboard com saldo, entradas, saidas, meta mensal e grafico de fluxo.
- Deposito, saque, transferencia e PIX simulado.
- Historico de transacoes com filtros.
- Cartao com limite, fatura, compra, bloqueio e pagamento.
- Investimentos com aplicacao, rendimento demonstrativo e resgate.
- Emprestimos com simulacao de parcelas e solicitacao.
- Abertura de conta com fluxo KYC demonstrativo.
- Painel administrativo com usuarios, auditoria e aprovacoes.
- Relatorios em CSV e comprovante PDF via backend.
- Layout responsivo para celular, notebook e desktop.
- Modo de demonstracao por arquivo local, sem servidor.
- Estrutura preparada para Docker, PostgreSQL e deploy em nuvem.

## Tecnologias Utilizadas

- **HTML5, CSS3 e JavaScript** para a interface.
- **Node.js** com servidor HTTP nativo.
- **JSON local** como persistencia demonstrativa.
- **PostgreSQL preparado** via schema/migrations em `docs/`.
- **Docker e Docker Compose** para evolucao de ambiente.
- **GitHub Actions** para validacao automatizada.
- **PWA** com manifest e service worker versionado.

## Como Rodar

### Modo mais simples para portfolio

Abra o arquivo:

```text
NEXTTT_BANK_NAVEGADOR.html
```

Ou use o atalho no Windows:

```text
CLIQUE_AQUI_PARA_ABRIR_NEXTTT_BANK.bat
```

Esse modo abre a interface diretamente no navegador, sem depender de servidor local.

### Modo com API local

```bash
npm start
```

Depois acesse:

```text
http://localhost:3000/?v=12
```

Login demo:

```text
cliente@nextt.local
admin@nextt.local
Senha: Nextt@123
```

## Scripts

```bash
npm start          # inicia o servidor local
npm test           # roda testes estruturais
npm run test:api   # roda smoke test de API
npm run test:e2e   # valida preparacao para E2E
npm run backup     # gera backup dos dados locais
npm run docker     # sobe ambiente com Docker Compose
```

## Estrutura do Projeto

```text
.
|-- public/              # Interface web, PWA, CSS e JavaScript
|-- src/                 # Servidor Node.js, config, logger e persistencia
|-- src/db/              # Adaptadores JSON e PostgreSQL preparado
|-- docs/                # Arquitetura, deploy, seguranca, schema e migrations
|-- images/              # Screenshots usados no README
|-- scripts/             # Backup, reset demo e captura de prints
|-- tests/               # Testes estruturais e smoke test
|-- .github/workflows/   # CI do GitHub Actions
|-- Dockerfile
|-- docker-compose.yml
|-- README.md
```

## Qualidade e Seguranca

- Hash de senha com PBKDF2 no backend.
- Controle de sessao e expiracao.
- Rate limit simples por IP/rota.
- Headers de seguranca HTTP.
- Auditoria de operacoes administrativas.
- Separacao entre interface, servidor, configuracao e camada de dados.
- Dados sensiveis reais nao sao usados no projeto.

## Melhorias Futuras

- Conectar PostgreSQL em producao.
- Implementar autenticação JWT/cookies seguros com HTTPS publico.
- Adicionar testes E2E completos com Playwright.
- Criar API REST documentada com OpenAPI/Swagger.
- Integrar envio real de e-mail/SMS para recuperacao de senha.
- Adicionar CI com cobertura de testes.
- Publicar deploy em Render, Railway, Vercel ou VPS.

## Sobre o Desenvolvedor

**Widinei Martins de Oliveira**

- Estudante de Analise e Desenvolvimento de Sistemas - Anhanguera.
- Previsao de conclusao: **06/2027**.
- Estudando pela Alura: Java, APIs, Banco de Dados e desenvolvimento backend.
- Buscando oportunidades de **estagio**, **vaga junior** ou **freelancer**.

## Contato

- GitHub: [github.com/Widineii](https://github.com/Widineii)
- LinkedIn: [www.linkedin.com/in/widineimartinsdev](https://www.linkedin.com/in/widineimartinsdev)
- WhatsApp: [w.app/widineii](https://w.app/widineii)

