# TÔNG MÔN 8D: TU TIÊN CHI LỘ — DEVELOPMENT SETUP & REPRODUCIBILITY GUIDE

## 1. Required Runtime Versions

- **Node.js:** `>= 20.x` (verified on Windows `v22.16.0` and macOS `v24.14.1`)
- **npm:** `>= 10.x` (verified on `10.9.2` and `11.11.0`)
- **Python:** `>= 3.11` (verified on `3.12.10` on Windows and `3.14.4` on macOS; required for `npm run verify:assets` and Python art-processing/QA scripts; `python3` executable must be on `PATH`)
- **Database:** Zero external setup required by default — `apps/server` (`apps/server/src/db.ts`) uses embedded PostgreSQL (`@electric-sql/pglite`). An optional external PostgreSQL instance can be used by setting `DATABASE_URL`.

---

## 2. Fresh Repository Setup

Clone the repository and enter the workspace directory:

```bash
git clone https://github.com/tienDang0805/tong-mon-8d tong-mon-8d
cd tong-mon-8d
```

Install Node.js monorepo dependencies (`packages/shared`, `packages/game-data`, `packages/art-tools`, `apps/server`, `apps/client`) reproducibly from `package-lock.json`:

```bash
npm ci
```

Install Python image-processing dependencies (`Pillow`, `numpy`, `scipy`) in a virtual environment:

- **macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

- **Windows (PowerShell):**
```powershell
python -m venv .venv
Copy-Item .\.venv\Scripts\python.exe .\.venv\Scripts\python3.exe -Force
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

*(Note on Windows: `packages/art-tools/verify_manifest.ts` invokes `python3`. Copying `python.exe` to `python3.exe` inside `.venv\Scripts` and the Python installation directory ensures `npm run verify:assets` resolves `python3` cleanly without relying on the Microsoft Store alias stub.)*

Install Playwright Chromium browser binaries (required only when running `npm run test:e2e`):

```bash
npx playwright install chromium
```

---

## 3. Environment Variable Configuration & PGlite Persistence Safety

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default variables in `.env.example`:
- `PORT=2567` — Colyseus authoritative WebSocket/HTTP server port.
- `PGDATA_DIR=./apps/server/data/pgdata` — Local embedded PGlite PostgreSQL data directory.
  - **Working Directory Note:** In `apps/server/src/db.ts`, if `PGDATA_DIR` is left empty, it defaults to `path.resolve(import.meta.dirname, "../data/pgdata")` (`<repo>/apps/server/data/pgdata`). When `PGDATA_DIR=./apps/server/data/pgdata` is set in `.env` and `npm run dev:server` executes with working directory `apps/server/`, relative path resolution creates `apps/server/apps/server/data/pgdata`. Both `apps/server/data/`, `apps/server/apps/`, `.pgdata/`, and `**/pgdata/` are protected in `.gitignore` so local databases can never be accidentally committed.
- `DATABASE_URL=` — Optional external PostgreSQL connection string (overrides `PGDATA_DIR` when non-empty).
- `VITE_SERVER_URL=http://127.0.0.1:2567` — Client server endpoint.
- `OPENAI_API_KEY=`, `GEMINI_API_KEY=`, `XAI_API_KEY=`, `ARK_API_KEY=`, `FAL_KEY=` — Optional external AI provider keys for `.agents/skills/generate2dmedia/scripts/route_media.py` (never required to build or run the game, and never invoked without explicit owner authorization).

---

## 4. Verifying Assets, Running Tests & Safe Production Builds

Verify `assets/manifest.json`, `assets/provenance.json`, spritesheet dimensions (`480x1920` for upgraded `80x96` multi-pose sheets and `288x1024` for legacy `48x64` sheets), transparency, and Tiled `.tmj` maps:

```bash
npm run verify:assets
```

Run all authoritative server and canonical progression integration tests (`6` tests in `apps/server/src/__tests__/server.test.ts`):

```bash
npm test
```

Run full TypeScript project-reference typechecking across all packages and apps:

```bash
npm run typecheck
```

Run the standalone cultivation progression and economy balance simulator:

```bash
npm run test:sim
```

Run the full production build (`verify:assets` + TypeScript compilation + Vite client bundle). This command never overwrites or regenerates artwork:

```bash
npm run build
```

---

## 5. Running Backend & Frontend in Development

Start both the Colyseus authoritative server (`http://127.0.0.1:2567`) and the Phaser 4 + Vite client (`http://127.0.0.1:5173`) concurrently:

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

- **Windows Platform Compatibility Note (`apps/server/src/index.ts`):**
  Lines 88–91 of `apps/server/src/index.ts` already normalize Windows backslashes (`const normalizedEntry = (process.argv[1] ?? "").replace(/\\/g, "/");`) before checking `normalizedEntry.endsWith("src/index.ts") || normalizedEntry.endsWith("dist/index.js")` (patched in commit `7914c2a` / `e0eab60`). Note that `.env.example` still defines a relative `PGDATA_DIR=./apps/server/data/pgdata`, which resolves relative to `apps/server/` when `npm run dev:server` executes (creating `apps/server/apps/server/data/pgdata`, which is ignored by `.gitignore`; see Section 3 above).

---

## 6. Safe Artwork Pipeline Commands

- **Non-Destructive Manifest Refresh (`npm run generate:art`):**
  Refreshes `assets/manifest.json` and `assets/provenance.json` while preserving all existing PNG/GIF/JSON files on disk (`FORCE_REBUILD = False`).
- **Restricted Forced Re-Packaging (`npm run generate:art:force`):**
  Rebuilds runtime sheets from `assets/source_ai/` and `assets/concepts/`. **Do NOT run `npm run generate:art:force` without explicit project-owner authorization.**
