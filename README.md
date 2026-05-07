# RestaurantStyle

Aplicacao web reutilizavel para restaurantes, com area publica responsiva e painel administrativo funcional usando LocalStorage.

## Stack

- React + Vite
- TypeScript
- React Router DOM
- TailwindCSS
- lucide-react
- Componentes reutilizaveis inspirados em shadcn/ui

## Como rodar

```bash
npm install
npm run dev
```

Depois acesse a URL exibida no terminal.

Para usar login, cadastro e reservas protegidas em desenvolvimento, rode a API em outro terminal:

```bash
npm run dev:api
```

Configure o email copiando `.env.example` para `.env` e preenchendo os dados SMTP reais. Nao versione o `.env`.

Para deploy separado:

- Na Vercel, configure `VITE_API_URL=https://api.seudominio.com`.
- Na VPS/API, configure `APP_URL=https://seudominio.com` e `FRONTEND_URL=https://seudominio.com`.
- Em producao, a API usa cookies `httpOnly`, `Secure` e `SameSite=None`, entao HTTPS e obrigatorio.

## Docker para VPS

Build da imagem:

```bash
docker build -t restaurant-style .
```

Rodar em producao:

```bash
docker run -d --name restaurant-style -p 80:4000 -e JWT_SECRET="troque-este-segredo" restaurant-style
```

O container roda a API Express e tambem serve o build estatico do Vite com fallback para React Router.

## Login administrativo

- URL: `/admin/login`
- E-mail: `admin@restaurante.com`
- Senha: `admin123`

A mesma tela de login atende clientes e administradores. Clientes cadastrados sao redirecionados para `/meus-agendamentos`; administradores sao redirecionados para `/admin/dashboard`.

## Funcionalidades

- Site publico com home, sobre, eventos, cardapio, detalhes de pratos, reservas e contato.
- Botao flutuante de WhatsApp configuravel.
- Cardapio com categorias, destaques, disponibilidade e pedidos via WhatsApp.
- Reservas salvas em LocalStorage e visiveis no painel administrativo.
- Disponibilidade por data/horario com capacidade por slot, bloqueios manuais e regra de ultimo horario antes do fechamento.
- Estrutura segura para pagamentos simulados por Pix, cartao ou pagamento no local, preparada para backend e gateways.
- Painel de pagamentos com status separados de reserva/pagamento, auditoria e estornos manuais simulados.
- Admin com dashboard, gerenciamento de reservas, pratos, categorias e configuracoes do restaurante.
- Dados mockados realistas em `src/data/initialData.ts`.

## Pagamentos e seguranca

O projeto inclui apenas simulacao para desenvolvimento. Em producao, pagamentos reais devem ser processados somente por backend seguro integrado a Stripe, Mercado Pago, Pagar.me, Asaas ou provedor equivalente. A confirmacao real de pagamento deve vir por webhook do gateway. Dados de cartao nunca devem passar pelo frontend do restaurante, nem serem salvos em LocalStorage, banco, estado global ou logs. Estornos reais devem ser feitos via API segura do provedor.

## Estrutura

```txt
src/
  components/
    admin/
    layout/
    public/
    ui/
  data/
  hooks/
  pages/
    admin/
    public/
  types/
  utils/
```

## Preparado para evoluir

A camada de persistencia fica concentrada em `src/hooks/useRestaurantData.ts` e `src/utils/storage.ts`. Para integrar com backend/API, substitua as chamadas de LocalStorage por chamadas HTTP mantendo os mesmos tipos TypeScript.
