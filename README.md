# Teste técnico — API Next.js + Postgres

API REST com Next.js (App Router), Drizzle ORM, PostgreSQL, validação Zod, senhas com `bcryptjs` e sessão via JWT em cookie httpOnly (`jose`).

## Pré-requisitos

- Node.js 20+
- Banco PostgreSQL (ex.: [Neon](https://neon.tech/) grátis ou Vercel Postgres)

## Configuração

1. Copie variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

2. Preencha `DATABASE_URL` e `AUTH_SECRET` (mínimo 16 caracteres; em produção use valor longo e aleatório).

3. Aplique o schema ao banco:

   ```bash
   npm run db:push
   ```

   Alternativa: `npm run db:generate` gera migrações SQL em `drizzle/`; use seu fluxo de migrate preferido.

## Desenvolvimento

```bash
npm run dev
```

Rotas da API usam `runtime = "nodejs"` (necessário para bcrypt e driver Postgres).

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/users` | Cadastro (CPF, RG, nome, idade, email, login, senha). CPF só dígitos. |
| POST | `/api/auth/login` | Body: `login`, `senha`. Define cookie `session`. |
| GET | `/api/users` | Lista usuários ativos. Requer cookie de sessão. |
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

- `npm run db:push` — sincroniza schema com o banco (desenvolvimento / protótipo).
- `npm run db:generate` — gera arquivos de migração.
- `npm run db:studio` — UI do Drizzle Studio (requer `DATABASE_URL`).
