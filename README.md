# Teste técnico — API Next.js + Postgres

API REST com Next.js (App Router), Drizzle ORM, PostgreSQL, validação Zod, senhas com `bcryptjs` e sessão via JWT em cookie httpOnly (`jose`).

## Estrutura do diretório

Pastas geradas em runtime (`.next/`, `node_modules/`, `.pglite-data/`, etc.) costumam estar no `.gitignore` e não entram no versionamento. Abaixo, o que importa no código e na configuração.

### Visão em árvore (resumo)

```text
.
├── docs/                 # documentação
├── drizzle/              # migrações SQL + metadado Drizzle
├── public/               # arquivos estáticos
├── scripts/              # Node: sync, migrações, teste de DB
├── src/
│   ├── app/              # App Router: páginas, layouts, API routes
│   ├── components/       # componentes React
│   ├── db/               # schema + cliente Drizzle
│   └── lib/              # auth, zod, helpers
├── .env.example          # modelo de variáveis de ambiente
├── AGENTS.md             # notas para agentes/IA no repositório
├── drizzle.config.ts     # Drizzle com DATABASE_URL (Postgres “real”)
├── drizzle.pglite.config.ts
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json
├── tsconfig.json
└── tsconfig.tsbuildinfo  # (gerado pelo TypeScript, pode ser ignorado)
```

### `src/app/` — App Router

- **`layout.tsx`** — layout raiz; envolve todas as rotas.
- **`page.tsx`** — página inicial.
- **`globals.css`** — estilos globais.
- **`favicon.ico`** — ícone do app.

Páginas por rota (cada pasta pode ter `page.tsx` e, se existir, `layout.tsx`):

| Pasta | Função |
|--------|--------|
| `login/` | Tela de login do usuário. |
| `registro/` | Cadastro de usuário. |
| `clientes/` | Área de clientes (formulário/listagem). |
| `pedidos/` | Área de pedidos. |
| `administrador/` | Painel admin (login de admin e gestão de usuários). |

**API** — cada `route.ts` define os métodos HTTP daquele segmento (`GET`, `POST`, `PATCH`, `DELETE` conforme o arquivo).

| Arquivo | Rota |
|---------|------|
| `api/auth/login/route.ts` | `/api/auth/login` |
| `api/auth/logout/route.ts` | `/api/auth/logout` |
| `api/auth/me/route.ts` | `/api/auth/me` |
| `api/users/route.ts` | `/api/users` |
| `api/users/[id]/route.ts` | `/api/users/:id` |
| `api/orders/route.ts` | `/api/orders` |
| `api/orders/[id]/route.ts` | `/api/orders/:id` |
| `api/clients/route.ts` | `/api/clients` |
| `api/clients/[id]/route.ts` | `/api/clients/:id` |
| `api/admin/login/route.ts` | `/api/admin/login` |
| `api/admin/logout/route.ts` | `/api/admin/logout` |
| `api/admin/users/[id]/route.ts` | `/api/admin/users/:id` |

### `src/components/`

| Arquivo | Uso |
|---------|-----|
| `AppShell.tsx` | Shell com layout comum (navegação, etc.). |
| `SidebarNavLink.tsx` | Links da barra lateral. |
| `InlineLoginForm.tsx` | Formulário de login embutido. |
| `LogoutButton.tsx` | Botão de sair (sessão usuário). |
| `ClientesCadastroForm.tsx` / `ClientesView.tsx` | Formulário e visão de clientes. |
| `PedidosCadastroForm.tsx` / `PedidosView.tsx` | Formulário e listagem de pedidos. |
| `AdministradorLoginForm.tsx` / `AdministradorLogoutButton.tsx` / `AdministradorUsersTable.tsx` | Painel administrador. |

### `src/db/`

| Arquivo | Função |
|---------|--------|
| `schema.ts` | Tabelas e colunas Drizzle (fonte de verdade do modelo). |
| `index.ts` | Export do cliente/instância de boco usada pela aplicação. |

### `src/lib/`

| Arquivo | Função |
|---------|--------|
| `auth.ts` | Sessão JWT, cookies, verificação de usuário autenticado. |
| `schemas.ts` | Schemas Zod compartilhados (validação de entrada). |
| `rate-limit.ts` | Limite de requisições (onde estiver em uso). |
| `user-public.ts` | Formato “público” de usuário (sem segredos). |
| `cliente-row.ts` / `clients-shared.ts` / `pedido-row.ts` | Tipos ou mapeamento linha → DTO para clientes e pedidos. |

### `drizzle/`

- Arquivos `0000_*.sql`, `0001_*.sql`, … — migrações em ordem.
- `meta/_journal.json` e `meta/*_snapshot.json` — controle e snapshots usados pelo Drizzle Kit; não edite à mão salvo exceção.

### `scripts/`

| Script | Papel |
|--------|--------|
| `sync-db.mjs` | Roda `drizzle-kit push` alinhado ao `schema.ts` (chamado no `npm run dev` e por `db:sync` / `db:migrate`). Respeita `USE_PGLITE`, `SKIP_DB_SYNC`. |
| `apply-migration-files.mjs` | Aplica arquivos `.sql` de `drizzle/` (fluxo “só migrações”). |
| `ensure-orders-columns.cjs` | Garante colunas esperadas em pedidos (utilitário/legado de schema). |
| `test-db.cjs` | Teste de conexão com o banco (`npm run db:test`). |

### `docs/`

- **`API.md`** — referência de endpoints, payloads e respostas (complementa a tabela de endpoints abaixo).

### `public/`

- SVGs e outros assets servidos em `/` (ex.: `file.svg`, `next.svg`, `vercel.svg`, etc.).

### Raiz — configuração

| Arquivo | Descrição |
|---------|-----------|
| `drizzle.config.ts` | Config do Drizzle Kit para Postgres via `DATABASE_URL`. |
| `drizzle.pglite.config.ts` | Config alternativa para desenvolvimento com PGlite. |
| `next.config.ts` | Configuração do Next.js. |
| `tsconfig.json` / `next-env.d.ts` | TypeScript e tipos do Next. |
| `eslint.config.mjs` | Regras do ESLint. |
| `.env.example` | Modelo de variáveis (Produção/Neon). Em `next dev` o PGlite e o JWT têm padrão sem ficheiro. |
| `AGENTS.md` | Instruções para ferramentas de agente/IA no projeto. |

## Pré-requisitos

- Node.js 20+
- Banco PostgreSQL em produção/homologação (ex.: [Neon](https://neon.tech/) gratuito). Em desenvolvimento local você pode usar PGlite (abaixo) sem `DATABASE_URL`.

### Só Node (PGlite)

[PGlite](https://pglite.dev/) é um Postgres compilado para WASM e empacotado no `npm`. Usa o **mesmo** schema Drizzle (`pg-core`) que o Neon.

**Desenvolvimento local (fluxo padrão):** depois de `npm install`, rode `npm run dev`. A app escolhe PGlite se não houver `DATABASE_URL` (e o sync roda o push contra o PGlite).

Opcional: `PGLITE_DATA_DIR=.pglite-data` (já é o padrão; a pasta é criada sozinha e está no gitignore). Para forçar PGlite mesmo com `DATABASE_URL` no ficheiro, use `USE_PGLITE=1`. Para forçar Postgres remoto sem apagar a variável, use `USE_PGLITE=0` e preencha `DATABASE_URL`.

Aplicar o schema **sem** `npm run dev`: `npm run db:push:pglite` (PGlite) ou `npm run db:push` (só com `DATABASE_URL` no `drizzle.config.ts`).

## Configuração

**Apenas desenvolvimento local (PGlite, sem `.env`):** nada a fazer. `npm install` e `npm run dev` bastam.

**Produção ou Postgres remoto (Neon, etc.):** defina `DATABASE_URL` (e, em qualquer `next start` / deploy, `AUTH_SECRET` com pelo menos 16 caracteres). Pode copiar a lista de chaves a partir de `.env.example` para um ficheiro `.env.local` no seu posto de trabalho.

- **Schema:** o `npm run dev` sincroniza o esquema automaticamente. Manualmente: `npm run db:push` (com `DATABASE_URL`) ou `npm run db:push:pglite` (com PGlite explícito via `USE_PGLITE=1` ou padrão local acima). Alternativa: `npm run db:generate` e o seu fluxo de migrações.

## Desenvolvimento

```bash
npm install
npm run dev
```

Rotas da API usam `runtime = "nodejs"` (necessário para bcrypt e driver Postgres).

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/users` | Cadastro (CPF, RG, nome, idade, email, login, senha). CPF só dígitos. |
| POST | `/api/auth/login` | Body: `login`, `senha`. Define cookie `session`. |
| GET | `/api/users` | Dados do usuário logado. Requer cookie de sessão. |
| PATCH | `/api/users/[id]` | Atualização parcial. Só o próprio usuário. |
| DELETE | `/api/users/[id]?mode=soft\|hard` | Exclusão lógica (default) ou física. Só o próprio usuário. |
| POST | `/api/orders` | Body: `descricao`. `user_id` vem da sessão. |
| GET | `/api/orders` | Lista pedidos; opcional `?userId=<uuid>`. Requer sessão. |

Respostas de usuário não incluem hash de senha.

## Deploy (Vercel)

1. Crie o projeto na Vercel e configure `DATABASE_URL` e `AUTH_SECRET`.
2. Rode `npm run db:push` (ou migrações) apontando para o mesmo banco de produção.
3. Faça o deploy; garanta que o provedor Postgres aceite conexões da Vercel (SSL, etc.).

## Scripts úteis

- `npm run db:push` — sincroniza schema com o banco via `DATABASE_URL` (desenvolvimento / protótipo).
- `npm run db:push:pglite` — mesmo para modo `USE_PGLITE=1` (usa `drizzle.pglite.config.ts`).
- `npm run db:generate` — gera arquivos de migração.
- `npm run db:studio` — UI do Drizzle Studio (requer `DATABASE_URL`).
