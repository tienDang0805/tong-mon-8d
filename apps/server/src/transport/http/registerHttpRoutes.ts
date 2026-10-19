import express, { type Application } from "express";
import type { ZoneId } from "@tong-mon-8d/shared";
import type { GameDatabase } from "../../db.js";
import type { AuthoritativeWorldEngine } from "../../runtime/world/WorldRuntime.js";
import type { ZoneRoom } from "../colyseus/ZoneRoom.js";
import { registerCharacterHttpRoutes } from "./character/registerCharacterHttpRoutes.js";

export interface RegisterHttpRoutesOptions {
  app: Application;
  db: GameDatabase;
  getEngine: () => AuthoritativeWorldEngine;
  getActiveZoneRoom: (zoneId: ZoneId) => ZoneRoom | undefined;
  enableTestClockApi?: boolean;
}

export function isTestClockApiExplicitlyEnabled(
  explicitOption?: boolean,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (explicitOption === true) {
    return true;
  }
  if (explicitOption === false) {
    return false;
  }
  return env.ENABLE_TEST_CLOCK_API === "true";
}

export function registerHttpRoutes(options: RegisterHttpRoutesOptions): void {
  const { app, db, getEngine, getActiveZoneRoom } = options;
  const allowTestClock = isTestClockApiExplicitlyEnabled(options.enableTestClockApi);

  app.use(express.json());
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,x-guest-token"
    );
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.get("/health", (_req, res) => {
    const eng = getEngine();
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

  if (allowTestClock) {
    app.post("/api/test/advance-clock", (req, res) => {
      const deltaMs = Number(req.body?.deltaMs ?? 0);
      if (Number.isFinite(deltaMs) && deltaMs > 0) {
        getEngine().advanceSimulatedClockMs(deltaMs);
      }
      res.json({ ok: true, serverTime: getEngine().now() });
    });
  }

  app.post("/api/v02/auth/guest", async (req, res) => {
    try {
      if (req.body?.guestToken !== undefined) {
        const verified = await db.guestIdentity.verifyGuestToken(req.body.guestToken);
        if (!verified.ok) {
          res.status(401).json({
            ok: false,
            code: verified.code,
            messageVi: "Chứng chỉ danh tính khách v0.2 không hợp lệ."
          });
          return;
        }
        res.json({
          ok: true,
          code: "OK",
          messageVi: "Đã xác thực danh tính khách v0.2 thành công.",
          accountId: verified.accountId
        });
        return;
      }

      const issued = await db.guestIdentity.issueGuestCredential();
      res.json({
        ok: true,
        code: "OK",
        messageVi: "Đã cấp mới danh tính khách v0.2 thành công.",
        accountId: issued.accountId,
        guestToken: issued.guestToken
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        code: "INTERNAL_ERROR",
        messageVi: String(err)
      });
    }
  });

  registerCharacterHttpRoutes({
    app,
    db,
    getEngine
  });
}
