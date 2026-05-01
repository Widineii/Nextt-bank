# E-mail e seguranca

## E-mail

O projeto tem um adaptador local em `mailer.js`.

Em desenvolvimento, mensagens ficam em:

```text
data/outbox
```

Para producao, troque `sendMail` por um provedor real como SMTP, SendGrid, Resend ou Amazon SES.

## Sessao

O servidor agora aceita:

- Token Bearer para compatibilidade com o app atual.
- Cookie `nextt_session` HttpOnly.
- Cookie `nextt_refresh` HttpOnly para renovar sessao em `/api/refresh`.

Em producao com HTTPS, adicione `Secure` aos cookies.

## 2FA

O codigo atual ainda e demo. O caminho real e:

1. Gerar codigo aleatorio por login sensivel.
2. Guardar hash do codigo com expiracao curta.
3. Enviar por e-mail/SMS/app autenticador.
4. Exigir validacao antes de liberar operacoes de alto risco.
