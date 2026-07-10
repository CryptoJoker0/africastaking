# AFRICA X1 NFT Staking

A standalone NFT staking module for the AFRICA X1 Genesis collection. Users connect their wallet, stake NFTs to earn three reward tokens (XNT, X1Brains, AF), claim rewards, and unstake. Admin panel at `/admin` (API-key protected).

## Run & Operate

- `pnpm --filter @workspace/nft-staking run dev` — run the frontend (port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `ADMIN_API_KEY` — secret key required to access `/api/admin/*` routes (send as `X-Admin-Key` header or `?adminKey=` query param)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Framer Motion + Rajdhani/Plus Jakarta Sans fonts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (staked_nfts, staking_events, staking_config, reward_rates, reward_history, nft_registry)
- `artifacts/api-server/src/routes/staking.ts` — Staking routes (stake, unstake, claim, rewards, dashboard, NFTs)
- `artifacts/api-server/src/routes/admin.ts` — Admin routes (config, stats, treasury, events, history)
- `artifacts/api-server/src/middlewares/adminAuth.ts` — Admin API key middleware
- `artifacts/api-server/src/lib/rewards.ts` — Reward calculation logic
- `artifacts/nft-staking/src/pages/staking.tsx` — Main staking page
- `artifacts/nft-staking/src/pages/admin.tsx` — Admin panel (accessible at /admin only)
- `artifacts/nft-staking/src/lib/wallet-context.tsx` — Wallet connection state

## Architecture decisions

- **Reward rates are DB-driven** — stored in `reward_rates` table, configurable via admin panel without code changes.
- **Re-staking uses partial unique index** — `staked_nfts.token_id` is not globally unique; a `WHERE is_active = true` partial index prevents double-staking while allowing re-staking after unstake.
- **Admin routes protected by API key** — set `ADMIN_API_KEY` env var; pass as `X-Admin-Key` header. Without it, admin endpoints return 503.
- **NFT ownership enforced from registry** — only NFTs in `nft_registry` for the correct wallet can be staked; no auto-registration bypass.
- **Wallet connection is simulated** — frontend uses a mock wallet state (no Web3 lib required for the staking module).

## Product

- **Staking page** (`/`): Connect wallet → view owned AFRICA X1 NFTs → stake to vault → watch live reward counters → claim or unstake
- **Dashboard**: Wallet address, NFTs owned/staked, pending XNT/X1Brains/AF, lifetime earnings, total value
- **Admin panel** (`/admin`): Enable/pause staking and claiming, configure reward rates per rarity tier, view all staked NFTs, treasury balances, event log, reward history
- **Reward tokens**: XNT, X1Brains, AFRICA Token (AF) — all three shown on every card and dashboard
- **Rarity tiers**: Common, Uncommon, Rare, Epic, Legendary — each has configurable daily reward rates

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` after changing `lib/db/src/schema/` before checking artifact packages.
- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before touching the frontend.
- The partial unique index (`staked_nfts_token_id_active_idx WHERE is_active = true`) was added manually via SQL — it won't appear in Drizzle's push output but must exist in production.
