# Deploy no Netlify

Este projeto tambem pode ser publicado no Netlify como vitrine web em modo demo. A pagina inicial redireciona automaticamente para a interface em:

```text
public/index.html?v=12&demo=cliente
```

## Passo a passo

1. Acesse `https://app.netlify.com` e entre com sua conta do GitHub.
2. Clique em `Add new site` e depois `Import an existing project`.
3. Escolha GitHub e selecione o repositorio `Widineii/Nextt-bank`.
4. Em `Base directory`, deixe vazio.
5. Em `Build command`, deixe vazio.
6. Em `Publish directory`, use:

```text
.
```

7. Clique em `Deploy`.

Login demo:

```text
cliente@nextt.local
admin@nextt.local
Senha: Nextt@123
```

## Observacao importante

No Netlify, o projeto fica como demonstracao web. Para usar a API local completa com servidor Node, rode:

```bash
npm start
```

Para backend publico com banco em producao, o melhor caminho continua sendo Render, Railway ou VPS.
