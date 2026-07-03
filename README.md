# Running

Personal marathon gap-analysis and injury-risk tracker. Mobile-first PWA, built for 1-2 known users via a single shared access link (no accounts).

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` from a Supabase project.
2. Apply `supabase/migrations/0001_init.sql` to that project.
3. Generate the shared access link: `npm run generate-token`
4. `npm run dev`, then open the printed link.

## Scripts

- `npm run dev` — start the dev server
- `npm run test` — run unit tests (Vitest) for the pure math modules
- `npm run generate-token` — mint the shared access link
