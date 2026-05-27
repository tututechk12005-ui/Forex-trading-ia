# ForexSignal AI — Telegram Bot + Web Dashboard

AI-powered Forex trading signals platform with a full-stack web dashboard and Telegram bot for broadcasting signals to subscribers.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/dashboard run dev` — run the React dashboard (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `SESSION_SECRET` — JWT signing secret (defaults to a fallback in dev)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + TailwindCSS (dark theme, glassmorphism, neon teal/violet)
- API: Express 5 + pino logging
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Telegram: node-telegram-bot-api
- Cron: node-cron (auto-analysis)
- Charts: Recharts

## Where things live

- `lib/db/src/schema/` — all Drizzle table definitions (source of truth for DB)
- `lib/api-spec/openapi.yaml` — OpenAPI 3 spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validation schemas
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/api-server/src/lib/` — analysis engine, telegram bot, cron, auth, seed
- `artifacts/dashboard/src/pages/` — React pages (dashboard, signals, stats, admin, settings)

## Architecture decisions

- **Contract-first API**: OpenAPI spec drives both frontend hooks and backend validation via Orval codegen. Never change the API without updating the spec and re-running codegen.
- **JWT auth**: Stateless JWT tokens stored in localStorage. First registered user auto-becomes admin. `requireAdmin` middleware protects admin endpoints.
- **Analysis engine with fallback**: The `analyzeSymbol()` function calls TwelveData API if a key is configured; falls back to simulated RSI/MACD/EMA/ATR calculations based on current price otherwise. Always returns a valid analysis.
- **Auto-analysis cron**: `node-cron` runs every N minutes (configurable). Only broadcasts signals with confidence ≥ 70. Cron restarts when settings change.
- **Telegram bot**: Polling mode (no webhook required in dev). Handles `/start`, `/subscribe`, `/unsubscribe`, `/signals`, `/help` commands. Admin panel can broadcast to all subscribers.

## Product

- **Dashboard**: Real-time pairs grid showing trend, bias, confidence for 10 instruments (Forex, Gold, Crypto, Indices). Click any pair to generate a signal on demand.
- **Signal generation**: Full RSI/MACD/EMA/ATR/SMC analysis engine with buy/sell/hold decision. Shows entry, SL, TP1, TP2, explanation.
- **Signal detectors**: Candle pattern detection (Engulfing, Hammer, Doji, Shooting Star) + S/R level display.
- **Signals history**: Table of all generated signals with filtering, result tracking (Win/Loss/Pending), pip count.
- **Stats & performance**: Win rate, profit factor, average pips, equity curve chart, performance by pair.
- **Admin panel**: User management, Telegram subscriber list, broadcast message, pair enable/disable toggle, auto-analysis toggle.
- **Settings**: Configure API keys (TwelveData, AlphaVantage, Binance, OpenAI), Telegram bot token, analysis interval.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`.
- Always run `pnpm --filter @workspace/db run push` after changing DB schema files.
- The `./custom-fetch` subpath export must be declared in `lib/api-client-react/package.json` for Vite to resolve it.
- Analysis and detector routes live in `routes/analysis.ts` and `routes/detectors.ts` (NOT inside `signals.ts`).
- Bot settings row must exist (seeded on startup) before cron starts.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
