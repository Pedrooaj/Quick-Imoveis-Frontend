# Quick Imóveis — Frontend

Plataforma que conecta compradores e corretores de imóveis. Compradores informam renda e valor de entrada, recebem recomendações personalizadas e podem contatar corretores diretamente. Corretores cadastram imóveis e acessam leads qualificados.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript 5 |
| Estilização | Tailwind CSS 4 |
| Componentes | shadcn/ui (new-york) + Radix UI |
| Ícones | Lucide React |
| Autenticação | NextAuth v4 (JWT) |
| Linting | Biome |
| Toasts | Sonner |

## Pré-requisitos

- Node.js 18+
- npm (ou pnpm / yarn)
- Backend da API rodando (NestJS)

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz:

```env
# URL da API backend (obrigatório)
NEXT_PUBLIC_API_URL=http://localhost:3001

# NextAuth (obrigatório)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-secreta-aqui

# Google OAuth (opcional — desabilita login com Google se ausente)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true
```

## Instalação e execução

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build
npm start
```

O app estará disponível em `http://localhost:3000`.

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com hot reload |
| `npm run build` | Build otimizado para produção |
| `npm start` | Inicia o servidor de produção |
| `npm run lint` | Verifica lint e formatação (Biome) |
| `npm run format` | Formata o código automaticamente |

## Estrutura do projeto

```
src/
├── app/                          # Rotas (App Router)
│   ├── layout.tsx                # Layout raiz (providers, tema, toaster)
│   ├── page.tsx                  # Landing page pública
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Endpoint NextAuth
│   │   └── proxy/[...path]/      # BFF proxy autenticado para a API
│   ├── imoveis/                  # Listagem e detalhe de imóveis (público)
│   ├── corretores/               # Listagem de corretores (público)
│   ├── corretor/[ownerId]/       # Portfólio de um corretor (público)
│   ├── (public)/                 # Páginas de auth (login, registro, etc.)
│   └── (private)/                # Páginas autenticadas (favoritos, perfil, etc.)
│
├── components/
│   ├── header/                   # AppHeader, HeaderNav, MobileNav, UserMenu, AuthButtons, RoleBadge
│   ├── providers/                # SessionProvider, ThemeProvider, BackendStatusProvider
│   ├── ui/                       # Componentes shadcn/ui (button, card, dialog, sheet, etc.)
│   ├── property-card.tsx         # Card de imóvel com subgrid (variantes: listing, my-properties, favorites)
│   ├── imoveis-list-content.tsx  # Listagem de imóveis com filtros e paginação
│   ├── property-detail-content.tsx # Página de detalhe do imóvel com carrossel
│   ├── corretores-content.tsx    # Listagem de corretores com busca
│   ├── corretor-portfolio-content.tsx # Portfólio do corretor com seus imóveis
│   ├── favorites-content.tsx     # Imóveis favoritados pelo usuário
│   ├── recommendations-content.tsx # Recomendações personalizadas
│   ├── properties-content.tsx    # "Meus anúncios" (CRUD de imóveis do corretor)
│   ├── create-property-wizard.tsx # Wizard de criação de imóvel (3 etapas)
│   ├── edit-property-form.tsx    # Formulário de edição de imóvel
│   ├── comments.tsx              # Sistema de comentários (imóveis e corretores)
│   ├── backend-wake-up-banner.tsx # Overlay de cold start do backend
│   └── ...
│
├── lib/
│   ├── api.ts                    # apiFetch (auth/proxy) + fetchPublic (público, com retry)
│   ├── api-error.ts              # Parsing de erros NestJS
│   ├── auth.ts                   # Configuração NextAuth (Credentials + Google)
│   └── utils.ts                  # Utilitário cn() do shadcn
│
└── types/
    ├── property.ts               # Tipos: Property, PropertyCreate, PropertyAddress, PropertyImage
    ├── profile.ts                # Tipos: Profile, ProfileUpdate, ProfileAddress
    └── next-auth.d.ts            # Extensão de tipos NextAuth (JWT com role, accessToken)
```

## Rotas da aplicação

### Públicas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page com apresentação da plataforma |
| `/imoveis` | Listagem de imóveis com filtros (tipo, preço, quartos, cidade) |
| `/imoveis/[id]` | Detalhe do imóvel com carrossel de imagens, dados do corretor e comentários |
| `/corretores` | Listagem de corretores com busca por nome/CRECI |
| `/corretor/[ownerId]` | Portfólio do corretor com seus imóveis e comentários |
| `/login` | Login por e-mail/senha ou Google OAuth |
| `/register` | Cadastro como comprador ou corretor |
| `/forgot-password` | Recuperação de senha |
| `/verify-email` | Verificação de e-mail |

### Autenticadas (requer login)

| Rota | Descrição |
|------|-----------|
| `/recomendacoes` | Recomendações personalizadas baseadas no perfil financeiro |
| `/favoritos` | Imóveis salvos como favoritos |
| `/perfil` | Edição de perfil (dados pessoais, endereço, financeiro) |
| `/meus-anuncios` | CRUD de imóveis (apenas corretores — role `CORRETOR`) |

## Arquitetura

### Autenticação

- **NextAuth v4** com estratégia JWT (sessão de 7 dias)
- **Providers**: Credentials (e-mail/senha) + Google OAuth (opcional)
- O backend retorna `access_token` + `expires_in` no login
- O token JWT do NextAuth armazena `accessToken`, `role` e `id` do usuário
- Páginas privadas são protegidas no layout `(private)/layout.tsx`

### Camada de API (BFF Proxy)

```
Cliente → /api/proxy/[...path] → Backend NestJS
```

- **`apiFetch(path)`** — Para chamadas autenticadas. Passa pelo proxy BFF que injeta o `Bearer token` automaticamente. Exibe toast de erro e faz sign-out em erros 401/403.
- **`fetchPublic(path)`** — Para chamadas públicas. Vai direto ao backend sem autenticação. Retorna `null` em caso de erro (sem toast).
- Ambos fazem **retry automático** (até 3 tentativas com backoff) em caso de 502/503 ou falha de rede — para lidar com cold starts do Render.

### Cold Start (Render)

O backend pode hibernar no plano gratuito do Render. O frontend lida com isso em duas camadas:

1. **Health check + Overlay**: O `BackendStatusProvider` faz polling em `GET /health` a cada 3s. Enquanto o backend não responde, um overlay informa ao usuário que o servidor está inicializando (30s a 2min).

2. **Retry nas chamadas**: Tanto `fetchPublic` quanto o proxy BFF fazem retry com backoff progressivo em erros 502/503 ou falha de rede.

### Responsividade

- **Mobile-first** com breakpoints Tailwind (`sm:640px`, `md:768px`, `lg:1024px`)
- **Header**: Menu hamburger (Sheet lateral) em telas < `md:`, nav horizontal em desktop
- **Grids de cards**: 1 coluna em mobile → 2 em `sm:` → 3 em `lg:`
- **Modais**: Largura `w-[95vw]` em mobile, `max-w-2xl` em desktop
- **Espaçamentos**: Responsivos (`space-y-6 sm:space-y-8`, `p-4 sm:p-5`, etc.)

### Comentários

Sistema de comentários reutilizável para imóveis e corretores:

- Listagem pública com paginação
- Criação com textarea + rating por estrelas (1-5, opcional)
- Edição inline e exclusão (apenas autor)
- Integrado em `/imoveis/[id]` e `/corretor/[ownerId]`

## Componentes UI (shadcn/ui)

Componentes instalados em `src/components/ui/`:

`alert` · `alert-dialog` · `button` · `card` · `checkbox` · `dialog` · `dropdown-menu` · `file-dropzone` · `input` · `label` · `select` · `sheet` · `skeleton` · `sonner`

Para adicionar novos:

```bash
npx shadcn@latest add [componente]
```

## Deploy

### Vercel (recomendado)

1. Importe o repositório na [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente no dashboard
3. A Vercel detecta Next.js automaticamente

### Outras plataformas

```bash
npm run build   # Gera a build em .next/
npm start       # Inicia em produção (porta 3000)
```

Defina `PORT` se necessário e configure todas as variáveis de ambiente listadas acima.

## Licença

Projeto privado.
