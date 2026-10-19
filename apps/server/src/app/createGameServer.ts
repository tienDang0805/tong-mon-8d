import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { GameDatabase, loadRepoEnvIfNeeded } from "../db.js";
import { AuthoritativeWorldEngine } from "../runtime/world/WorldRuntime.js";
import {
  ZoneRoom,
  configureServerSingletons,
  getActiveZoneRoom,
  getSharedEngine
} from "../transport/colyseus/ZoneRoom.js";
import { registerHttpRoutes } from "../transport/http/registerHttpRoutes.js";

export interface StartGameServerOptions {
  dataDir?: string;
  connectionString?: string;
  enableTestClockApi?: boolean;
}

export { loadRepoEnvIfNeeded };

export async function startGameServer(
  port = Number(process.env.PORT ?? 2567),
  dbOptions?: StartGameServerOptions
): Promise<{
  server: Server;
  db: GameDatabase;
  engine: AuthoritativeWorldEngine;
  shutdown: () => Promise<void>;
}> {
  const db = new GameDatabase({
    connectionString: dbOptions?.connectionString ?? process.env.DATABASE_URL,
    dataDir: dbOptions?.dataDir ?? process.env.PGDATA_DIR
  });
  await db.init();
  const engine = new AuthoritativeWorldEngine(db);
  configureServerSingletons(db, engine);

  const server = new Server({
    transport: new WebSocketTransport(),
    greet: false,
    express: (app) => {
      registerHttpRoutes({
        app,
        db,
        getEngine: getSharedEngine,
        getActiveZoneRoom,
        enableTestClockApi: dbOptions?.enableTestClockApi
      });
    }
  });

  server.define("tan_thu_thon", ZoneRoom, { zoneId: "tan_thu_thon" });
  server.define("thanh_truc_lam", ZoneRoom, { zoneId: "thanh_truc_lam" });
  server.define("zone_room", ZoneRoom).filterBy(["zoneId"]);

  try {
    await server.listen(port);
  } catch (err) {
    await db.close();
    throw err;
  }
  process.stdout.write(`TONG_MON_8D_SERVER_READY port=${port}\n`);

  const shutdown = async () => {
    await Promise.race([
      server.gracefullyShutdown(false).catch(() => {}),
      new Promise<void>((resolve) => setTimeout(resolve, 2000))
    ]);
    await db.close();
  };

  return { server, db, engine, shutdown };
}
