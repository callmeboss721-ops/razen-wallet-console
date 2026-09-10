# RAZEN Transfer Console — Base44 dev notes

## Stack
Vite 8 + TanStack Start (SSR) + React 19. Tailwind v4. better-auth for auth.
Database: **PGLite** (embedded Postgres compiled to WASM) when `DATABASE_URL` is
unset — no external DB service is needed for dev. Set `DATABASE_URL` to switch
to real Postgres (e.g. Neon); the same `migrations/` files apply.

## Run
```
docker compose -f docker-compose.base44.yml up -d --build
```
- Web entry point: host port **3000** → container port **8080** (Vite strictPort).
- Dev command: `npm run dev` = `node scripts/with-app-env.mjs vite dev --host 0.0.0.0 --port 8080`.
- `npm install` runs at container startup before the dev server.

## Auth (important)
`VITE_AUTH_ENABLED` controls sign-in:
- `false` (set in compose here) → no providers; `requireUserId` resolves a
  shared **dev user**. This is the project's own "shipped default" and what the
  Base44 preview uses, because the federated sign-in broker
  (`auth.grok.me`, `*.grok-sandbox.com` callbacks) is Grok-platform-specific and
  not reachable from this environment.
- unset/`true` → real federated Better Auth via the Grok broker; sign-in will
  NOT complete in the Base44 preview.

`VITE_AUTH_ENABLED=false` is safe here only because `DATABASE_URL` is unset
(PGLite). Setting `DATABASE_URL` while auth is disabled makes `requireUserId`
fail-closed on every request (by design — never share one dev user on a real DB).

## Env vars
Nothing is required to boot. All `.env.example` entries are optional:
- `RAZEN_MCP_TOKEN` — guards `/api/mcp`; when unset the endpoint is open.
- `TMN_*` — TrueMoney live credentials; without them the app runs in **sim** mode.
- `SHIP_SECRET` / `VERCEL_TOKEN` / `VERCEL_*` / `GITHUB_REPO_ID` — the push-to-deploy
  `/api/ship` CD pipeline; unused in dev.

External credentials belong in the platform secrets (delivered to
`/run/base44/app.env`), never committed. Local PGLite needs none.

## Vite host allowlist
`__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` is passed bare from the platform so
the preview proxy's external hostname reaches the dev server (Vite >= 6.1).

## Verify
- `curl -I http://localhost:3000/` → 200.
- Landing route `/` renders an iframe to `/welcome.html`.
- With auth off, `/desk`, `/transfer`, `/gifts`, `/history`, `/tools` render the
  operator console under the dev user.
