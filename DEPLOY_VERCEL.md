# Deploy no Vercel

Este projeto pode ser publicado no Vercel como uma vitrine web em modo demo. A interface abre direto no navegador e usa dados locais para demonstrar login, dashboard, operacoes, cartoes, investimentos e painel administrativo.

## Passo a passo

1. Acesse `https://vercel.com` e entre com sua conta do GitHub.
2. Clique em `Add New...` e depois `Project`.
3. Importe o repositorio `Widineii/Nextt-bank`.
4. Em `Framework Preset`, escolha `Other`.
5. Deixe `Build Command` vazio.
6. Deixe `Output Directory` vazio.
7. Clique em `Deploy`.

Depois do deploy, o link principal do Vercel abre:

```text
public/index.html?v=12&demo=cliente
```

Login demo:

```text
cliente@nextt.local
admin@nextt.local
Senha: Nextt@123
```

## Observacao importante

O deploy no Vercel publica a vitrine demonstrativa do projeto. Para rodar a API local com persistencia JSON, relatorios gerados pelo backend e servidor Node completo, use:

```bash
npm start
```

Para uma API publica com banco em producao, a melhor evolucao e hospedar o backend em Render, Railway ou VPS e manter o Vercel como frontend.
