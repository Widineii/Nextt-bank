# Banco de Dados Demo

Esta pasta contem uma base demonstrativa segura para o portfolio do **Nexttt Bank**.

## Arquivos

- `nextt-db.demo.json`: snapshot demo com usuarios, contas, transacoes, cartao, investimentos e emprestimos.

## Observacoes de seguranca

- Tokens de sessao foram removidos.
- Codigos de recuperacao de senha foram removidos.
- Logs locais nao sao versionados.
- Os e-mails sao ficticios (`@nextt.local`).
- O arquivo serve apenas para demonstracao e testes locais.

## Como usar

Para carregar essa base no modo local, copie o arquivo para `data/nextt-db.json` antes de iniciar o servidor:

```bash
copy database\nextt-db.demo.json data\nextt-db.json
npm start
```

No Linux/macOS:

```bash
mkdir -p data
cp database/nextt-db.demo.json data/nextt-db.json
npm start
```

