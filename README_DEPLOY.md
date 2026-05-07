# Deploy do RestaurantStyle

## Rodar Localmente

Terminal 1:

```bash
npm install
npm run dev:api
```

Terminal 2:

```bash
npm run dev
```

Frontend local: `http://127.0.0.1:5173`
API local: `http://127.0.0.1:4000`

## Variaveis do Frontend

Crie `.env` na raiz para desenvolvimento local ou configure na Vercel:

```env
VITE_API_URL=https://api.seudominio.com
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-sua-public-key
```

Localmente, se usar o proxy do Vite, `VITE_API_URL` pode ficar vazio. Em producao, nunca use localhost.

## Variaveis da API

Crie `server/.env` na VPS:

```env
NODE_ENV=production
PORT=4000
APP_URL=https://seudominio.com
FRONTEND_URL=https://seudominio.com
JWT_SECRET=uma-chave-longa-e-aleatoria

MERCADOPAGO_ACCESS_TOKEN=TEST-seu-access-token
MP_WEBHOOK_URL=https://api.seudominio.com/api/payments/webhook/mercado-pago

EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=suporte@seudominio.com
EMAIL_PASS=sua-senha
EMAIL_FROM=suporte@seudominio.com
EMAIL_DISPLAY_NAME=Nome do site
EMAIL_SECURE=true
```

## Mercado Pago Sandbox

1. Acesse o painel de desenvolvedor do Mercado Pago.
2. Use credenciais de teste:
   - `MERCADOPAGO_ACCESS_TOKEN` no backend.
   - `VITE_MERCADOPAGO_PUBLIC_KEY` no frontend.
3. Configure o webhook para:

```txt
https://api.seudominio.com/api/payments/webhook/mercado-pago
```

O sistema usa Checkout/Preference do Mercado Pago e nao recebe dados sensiveis de cartao. A confirmacao de pagamento acontece apenas pelo webhook, que consulta a API do Mercado Pago antes de atualizar o banco.

## Testar Pagamento de R$ 0,50

1. Cadastre e confirme um cliente.
2. Crie uma reserva escolhendo Pix, credito ou debito.
3. A taxa de reserva sera R$ 0,50.
4. Abra o link de checkout retornado pelo Mercado Pago.
5. Apos aprovacao sandbox, o webhook deve atualizar o pagamento para `Pago`.

Pedidos online tambem usam o mesmo padrao de pagamento e webhook.

## Testar Estorno

1. Entre como admin.
2. Acesse `Pagamentos`.
3. Em um pagamento aprovado, clique em `estornar`.
4. A API chama o endpoint de estorno do Mercado Pago quando existe `external_payment_id`.
5. O sistema registra admin responsavel, data/hora, motivo, status e ID do estorno quando retornado.
6. O botao fica indisponivel depois que o status deixa de ser `Pago`.

## Confirmacao de Email

1. Cadastre um cliente.
2. O backend gera token seguro com expiracao.
3. O email enviado aponta para:

```txt
https://seudominio.com/confirmar-email?token=...
```

4. A pagina chama a API e invalida o token apos uso.
5. Contas sem email confirmado nao conseguem reservar ou pedir.

## Recuperacao de Senha

1. No modal de login, clique em `Esqueci minha senha`.
2. Informe o email.
3. A API responde com mensagem generica, sem revelar se o email existe.
4. O email aponta para:

```txt
https://seudominio.com/redefinir-senha?token=...
```

5. A nova senha e salva com bcrypt e o token e invalidado.

## Deploy Frontend na Vercel

1. Suba o projeto para GitHub.
2. Importe na Vercel.
3. Configure:

```env
VITE_API_URL=https://api.seudominio.com
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-sua-public-key
```

4. Build command: `npm run build`.
5. Output: `dist`.

## Deploy API na VPS com Docker

Na raiz do projeto local:

```bash
docker build -t restaurant-api ./server
```

Na VPS:

```bash
docker run -d \
  --name restaurant-api \
  --env-file ./server/.env \
  -p 4000:4000 \
  -v restaurant-api-data:/app/data \
  restaurant-api
```

Use Nginx/Caddy/Traefik na VPS para expor HTTPS em `https://api.seudominio.com`.

## Checklist de Seguranca

- Nunca versionar `.env`.
- Usar HTTPS em producao.
- `JWT_SECRET` deve ser longo e unico.
- `MERCADOPAGO_ACCESS_TOKEN` fica somente no backend.
- O frontend usa apenas `VITE_MERCADOPAGO_PUBLIC_KEY`.
- CORS deve apontar para o dominio real do frontend via `FRONTEND_URL`.
- O banco SQLite da API deve persistir via volume Docker.
