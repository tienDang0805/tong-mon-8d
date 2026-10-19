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
- `PORT=2567` — Colyseus authoritative WebSocket/HTTP server port (`apps/server/src/index.ts` calls `loadRepoEnvIfNeeded()` when started as main module before reading `PORT` or database settings, preserving any explicitly exported environment variables).
- `PGDATA_DIR=./apps/server/data/pgdata` — Local embedded PGlite PostgreSQL data directory, resolved deterministically via `resolvePgDataDir` in `apps/server/src/db.ts`:
  - `memory://` stays in memory.
  - Explicit absolute paths are respected as-is.
  - When `PGDATA_DIR` is empty or targets the default/canonical path (`./apps/server/data/pgdata`), `resolvePgDataDir` checks both the canonical directory (`<repo>/apps/server/data/pgdata`) and the legacy nested directory (`<repo>/apps/server/apps/server/data/pgdata`):
    - **Existing legacy directory only (`PG_VERSION` present):** preserves and uses `<repo>/apps/server/apps/server/data/pgdata` in place.
    - **Existing canonical directory only (`PG_VERSION` present):** uses `<repo>/apps/server/data/pgdata`.
    - **Neither initialized:** uses `<repo>/apps/server/data/pgdata` for fresh installations (even when `cwd` is `<repo>/apps/server`).
    - **Both initialized:** fails closed with `SPLIT_BRAIN_PGDATA_DIR` rather than silently selecting one.
  - Custom relative paths resolve relative to `<repo>` by default, preserve an already-initialized `cwd`-relative directory if only that directory is initialized, and fail closed with `SPLIT_BRAIN_PGDATA_DIR` if both `<repo>`-relative and `cwd`-relative directories are initialized.
  - `apps/server/data/`, `apps/server/apps/`, `.pgdata/`, and `**/pgdata/` are protected in `.gitignore` so local databases and backups (`apps/server/data/backups/`) can never be accidentally committed.
- `DATABASE_URL=` — Optional external PostgreSQL connection string (overrides `PGDATA_DIR` when non-empty).
- `ENABLE_TEST_CLOCK_API=` — Optional explicit opt-in (`true`, or `enableTestClockApi: true` in `createGameServer`) required during isolated automated tests to register `POST /api/test/advance-clock` (`apps/server/src/transport/http/registerHttpRoutes.ts`). When omitted or false, the route is not registered and returns default `404`.
- `VITE_SERVER_URL=http://127.0.0.1:2567` — Client server endpoint.
- `OPENAI_API_KEY=`, `GEMINI_API_KEY=`, `XAI_API_KEY=`, `ARK_API_KEY=`, `FAL_KEY=` — Unused historical external provider variables (external paid media routes in `.agents/skills/generate2dmedia/scripts/route_media.py` are `DISABLED FOR PRODUCTION` per `AGENTS.md` Section 4).

---

## 4. Verifying Assets, Architecture, Running Tests & Safe Production Builds

Verify `assets/manifest.json` (`55` active entries), `assets/provenance.json`, `assets/corekit/v01b/catalog.json` (`validateCorekit.ts`, `16` active Core Kit references), spritesheet dimensions (`480x1920` for `full_80x96_20row` / `640x1920` for `full_80x96_20row_8walk` upgraded multi-pose sheets and `288x1024` for legacy `48x64` sheets), repo-relative provenance paths, `native_argon_image_generator` provider/method allowlists, `HERO-ANIMSET-01` (`DEC-009`) lineage, and Tiled `.tmj` maps:

```bash
npm run verify:assets
```

Verify the modular-monolith architecture (`0` circular imports, package/layer dependency rules, no internal barrel self-imports, no SQL in Colyseus transport handlers):

```bash
npm run verify:architecture
```

Verify the 40 frozen Technical Design Freeze v1.0 files (`39c41a6ddb77b93284c56da7ec053f4309ee4943`), required modular/archive/locator files and removed active paths, and `docs/tong-mon-8d-project-atlas.html` inline `<script>` syntax via `new vm.Script(...)` (note: this command is a mechanical file/freeze/syntax check and does not prove semantic status consistency across docs, which requires scoped agent self-review):

```bash
npm run verify:doc-sync
```

Run the standalone disposable fixture tests for the architecture, Core Kit, runtime asset packager, and doc-sync utilities:

```bash
node --import tsx --test scripts/tests/*.test.mjs
```

Run the current Vitest suite (the executable output, not a hard-coded historical count, determines the current total):

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

Run the isolated two-browser Playwright multiplayer smoke test (clears `DATABASE_URL`, forces `PGDATA_DIR=memory://` and `ENABLE_TEST_CLOCK_API=true`, verifies ports `2567` and `5173` are free before startup, and writes screenshots, frames, and GIF capture to a unique gitignored per-run directory `artifacts/playtest/runs/<run-id>/` without touching tracked `artifacts/playtest/*.png` or `assets/previews/`):

```bash
npm run test:e2e
```

Run the dedicated `S1-ENTRY-VISUAL-REBUILD-01` entry flow, multi-character roster, persisted zone/position resume, and `[ESC]` system menu Playwright verification (`memory://` PGlite only):

```bash
node --import tsx tests/e2e/entry/runEntryAndMultiCharacterVerification.ts
```

Run the full production build (`verify:assets` + TypeScript compilation + `vite build` + `npm run package:runtime-assets` copying runtime `/assets/...` and `/maps/...` into `apps/client/dist`). This command never overwrites or regenerates artwork:

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

- **Windows Platform Compatibility & `PGDATA_DIR` Resolution (`apps/server/src/index.ts`, `apps/server/src/infrastructure/database/PgAdapter.ts`):**
  `apps/server/src/index.ts` normalizes Windows backslashes (`const normalizedEntry = (process.argv[1] ?? "").replace(/\\/g, "/");`) before checking `normalizedEntry.endsWith("src/index.ts") || normalizedEntry.endsWith("dist/index.js")`, loads `<repo>/.env` via `loadRepoEnvIfNeeded()`, and delegates PGlite path resolution to `resolvePgDataDir` in `apps/server/src/infrastructure/database/PgAdapter.ts` (re-exported via `apps/server/src/db.ts`; see Section 3 above).

---

## 6. Artwork commands and verification scope

`npm run generate:art`, `npm run generate:art:force`, and `python packages/art-tools/build_assets.py` are **disabled fail-closed guards (`exit code 2`)** that refuse execution without modifying any files (the historical procedural generator is quarantined at `packages/art-tools/legacy/build_assets.py`). Use `npm run verify:assets` for read-only manifest, provenance, and Core Kit `v01b` verification; art production and post-processing strictly follow `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md` and `assets/corekit/v01b/catalog.json`.

The commands in this setup guide are available operations, not a mandatory startup checklist. Select checks with `AGENT_EXECUTION_CONTRACT.md` Section 3: docs-only work needs no game tests/build; test-only fixes run affected tests/type checks; standalone script changes run disposable script fixtures (`node --import tsx --test scripts/tests/*.test.mjs`); gameplay and slice acceptance retain their applicable integration checks. `npm run build` already includes `verify:assets` and `package:runtime-assets`.

Do not start `npm run dev` for a read-only review or docs task. For tests use the explicit isolated DB setup; never attach to a running owner's dev server to bypass an occupied E2E port. Diagnose environment blockers once and preserve other valid test evidence.
