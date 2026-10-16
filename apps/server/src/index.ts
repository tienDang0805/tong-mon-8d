import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import express from "express";
import { GameDatabase } from "./db.js";
import { AuthoritativeWorldEngine } from "./worldEngine.js";
import {
  ZoneRoom,
  configureServerSingletons,
  getActiveZoneRoom,
  getSharedEngine
} from "./zoneRoom.js";

const PORT = Number(process.env.PORT ?? 2567);

export async function startGameServer(port = PORT): Promise<{
  server: Server;
  db: GameDatabase;
  engine: AuthoritativeWorldEngine;
  shutdown: () => Promise<void>;
}> {
  const db = new GameDatabase({
    connectionString: process.env.DATABASE_URL,
    dataDir: process.env.PGDATA_DIR
  });
  await db.init();
  const engine = new AuthoritativeWorldEngine(db);
  configureServerSingletons(db, engine);

  const server = new Server({
    transport: new WebSocketTransport(),
    greet: false,
    express: (app) => {
      app.use(express.json());
      app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
        if (req.method === "OPTIONS") {
          res.sendStatus(200);
          return;
        }
        next();
      });

      app.get("/health", (_req, res) => {
        const eng = getSharedEngine();
        res.json({
          status: "ok",
          serverTime: eng.now(),
          zones: {
            tan_thu_thon: {
              playersOnline: getActiveZoneRoom("tan_thu_thon")?.getOnlinePlayerCount() ?? 0,
              monsters: Object.keys(eng.getZoneMonsters("tan_thu_thon")).length
            },
            thanh_truc_lam: {
              playersOnline: getActiveZoneRoom("thanh_truc_lam")?.getOnlinePlayerCount() ?? 0,
              monsters: Object.keys(eng.getZoneMonsters("thanh_truc_lam")).length
            }
          }
        });
      });

      app.post("/api/test/advance-clock", (req, res) => {
        const deltaMs = Number(req.body?.deltaMs ?? 0);
        if (Number.isFinite(deltaMs) && deltaMs > 0) {
          getSharedEngine().advanceSimulatedClockMs(deltaMs);
        }
        res.json({ ok: true, serverTime: getSharedEngine().now() });
      });
    }
  });

  server.define("tan_thu_thon", ZoneRoom, { zoneId: "tan_thu_thon" });
  server.define("thanh_truc_lam", ZoneRoom, { zoneId: "thanh_truc_lam" });
  server.define("zone_room", ZoneRoom).filterBy(["zoneId"]);

  await server.listen(port);
  process.stdout.write(`TONG_MON_8D_SERVER_READY port=${port}\n`);

  const shutdown = async () => {
    await server.gracefullyShutdown(false);
    await db.close();
  };

  return { server, db, engine, shutdown };
}

const isMainModule =
  Boolean(process.argv[1]) &&
  (process.argv[1].endsWith("src/index.ts") ||
    process.argv[1].endsWith("dist/index.js"));

if (isMainModule && !process.env.VITEST) {
  startGameServer(PORT).catch((err) => {
    process.stderr.write(`Server startup error: ${String(err)}\n`);
    process.exit(1);
  });
}
