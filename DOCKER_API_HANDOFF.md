# Entrega da API para VPS com Docker

Este guia e para o colaborador que vai subir a API do restaurante na VPS.

## Arquivos importantes

- `server/Dockerfile`: imagem Docker da API.
- `server/.dockerignore`: evita copiar arquivos sensiveis/desnecessarios.
- `server/.env.example`: modelo das variaveis de ambiente.
- `README_DEPLOY.md`: documentacao completa de deploy.

## Dockerfile da API

```dockerfile
FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV DATA_DIR=/app/data

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev

COPY index.js db.js mailer.js ./

EXPOSE 4000

CMD ["npm", "start"]
```

## Variaveis de ambiente da API

Na VPS, criar um arquivo `.env` para a API com base em `server/.env.example`.

Exemplo:

```env
NODE_ENV=production
PORT=4000
APP_URL=https://seudominio.com
FRONTEND_URL=https://seudominio.com
JWT_SECRET=gere-uma-chave-longa-e-aleatoria

MERCADOPAGO_ACCESS_TOKEN=TEST-seu-access-token
MP_WEBHOOK_URL=https://api.seudominio.com/api/payments/webhook/mercado-pago

EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=seu-email@seudominio.com
EMAIL_PASS=sua-senha-smtp
EMAIL_FROM=seu-email@seudominio.com
EMAIL_DISPLAY_NAME=Nome do Restaurante
EMAIL_SECURE=true
```

Nunca subir esse `.env` para o GitHub.

## Subir na VPS

Dentro da pasta do projeto na VPS:

```bash
docker build -t restaurant-api ./server
```

Rodar o container:

```bash
docker run -d \
  --name restaurant-api \
  --env-file ./server/.env \
  -p 4000:4000 \
  -v restaurant-api-data:/app/data \
  restaurant-api
```

Ver logs:

```bash
docker logs -f restaurant-api
```

Testar se a API esta respondendo:

```bash
curl http://127.0.0.1:4000/api/bootstrap
```

## Atualizar uma nova versao

```bash
docker stop restaurant-api
docker rm restaurant-api
docker build -t restaurant-api ./server
docker run -d \
  --name restaurant-api \
  --env-file ./server/.env \
  -p 4000:4000 \
  -v restaurant-api-data:/app/data \
  restaurant-api
```

## HTTPS e dominio

Usar Nginx, Caddy ou Traefik para publicar a API em HTTPS, por exemplo:

```txt
https://api.seudominio.com
```

O frontend na Vercel deve usar:

```env
VITE_API_URL=https://api.seudominio.com
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-sua-public-key
```

O backend deve usar `FRONTEND_URL` com o dominio real da Vercel para CORS.

## Observacoes importantes

- O banco SQLite fica persistido no volume Docker `restaurant-api-data`.
- O Access Token do Mercado Pago fica somente no backend.
- A Public Key do Mercado Pago fica no frontend.
- Pagamentos reais sao confirmados por webhook, nunca pelo frontend.
- Emails de confirmacao e recuperacao dependem das variaveis SMTP corretas.
