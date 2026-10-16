# TÔNG MÔN 8D: TU TIÊN CHI LỘ — DEVELOPMENT SETUP & REPRODUCIBILITY GUIDE

## 1. Required Runtime Versions

- **Node.js:** `>= 20.x` (verified on `v24.14.1`)
- **npm:** `>= 10.x` (verified on `11.11.0`)
- **Python:** `>= 3.11` (verified on `3.14.4`, required only when running Python art-processing or Pixel Art QA scripts)
- **Database:** Zero external setup required by default — `apps/server` uses embedded PostgreSQL (`@electric-sql/pglite`) stored in `.pgdata/`. An optional external PostgreSQL instance can be used by setting `DATABASE_URL`.

---

## 2. Fresh Repository Setup

Clone the repository and enter the workspace directory:

```bash
git clone <YOUR_GITHUB_REMOTE_URL> tong-mon-8d
cd tong-mon-8d
```

Install Node.js monorepo dependencies (`packages/shared`, `packages/game-data`, `packages/art-tools`, `apps/server`, `apps/client`):

```bash
npm install
```

Install Python image-processing dependencies (`Pillow`, `numpy`, `scipy`) in a virtual environment or user environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Install Playwright Chromium browser binaries (required only for running `npm run test:e2e`):

```bash
npx playwright install chromium
```

---

## 3. Environment Variable Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default variables in `.env.example`:
- `PORT=2567` — Colyseus authoritative WebSocket/HTTP server port.
- `PGDATA_DIR=.pgdata` — Local embedded PGlite PostgreSQL data directory (leave empty for in-memory test mode).
- `DATABASE_URL=` — Optional external PostgreSQL connection string (overrides `PGDATA_DIR` when non-empty).
- `VITE_SERVER_URL=ws://localhost:2567` — Optional client WebSocket endpoint override.
- `OPENAI_API_KEY=`, `GEMINI_API_KEY=`, `XAI_API_KEY=`, `FAL_KEY=`, `ARK_API_KEY=` — Optional external AI provider keys for `.agents/skills/generate2dmedia/scripts/route_media.py` (never required to build or run the game).

---

## 4. Running Backend & Frontend in Development

Start both the Colyseus authoritative server (`http://localhost:2567`) and the Phaser 4 + Vite client (`http://localhost:5173`) concurrently:

```bash
npm run dev
```

Or run them in separate terminals:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

---

## 5. Verifying Assets, Running Tests & Safe Production Builds

Verify `assets/manifest.json`, `assets/provenance.json`, spritesheet dimensions, transparency, and Tiled `.tmj` maps:

```bash
npm run verify:assets
```

Run all unit and authoritative server integration tests (15 tests across `packages/game-data` and `apps/server`):

```bash
npm test
```

Run the standalone cultivation progression and economy balance simulator:

```bash
npm run test:sim
```

Run the full production build (`verify:assets` + TypeScript compilation + Vite client bundle). This command never overwrites or regenerates artwork:

```bash
npm run build
```

Run the two-browser Playwright E2E multiplayer verification suite:

```bash
npm run test:e2e
```

---

## 6. Safe Artwork Pipeline Commands

- **Safe Non-Destructive Asset Check (`npm run generate:art`):**
  Refreshes `assets/manifest.json` and `assets/provenance.json` while preserving all existing PNG/GIF/JSON files on disk (`FORCE_REBUILD = False`).

```bash
npm run generate:art
```

- **Forced Deterministic Re-Packaging from Preserved AI Sources (`npm run generate:art:force`):**
  Re-slices and re-normalizes runtime sheets exclusively from the preserved `assets/source_ai/` and `assets/concepts/` files in the repository without making any AI generation calls:

```bash
npm run generate:art:force
```
