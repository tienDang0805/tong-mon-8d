import type { Application, Request } from "express";
import type {
  CharacterRosterResponsePayload,
  CharacterV02ActionResultPayload,
  SelectCharacterForWorldEntryResultPayload
} from "@tong-mon-8d/shared";
import type { GameDatabase } from "../../../db.js";
import type { AuthoritativeWorldEngine } from "../../../runtime/world/WorldRuntime.js";
import { toCharacterV02Snapshot } from "../../../features/character/CharacterSnapshot.js";

export interface RegisterCharacterHttpRoutesOptions {
  app: Application;
  db: GameDatabase;
  getEngine: () => AuthoritativeWorldEngine;
}

function extractGuestTokenFromRequest(req: Request): unknown {
  const authHeader = req.header("authorization") ?? req.header("Authorization");
  if (typeof authHeader === "string" && authHeader.trim().length > 0) {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith("bearer ")) {
      return trimmed.slice(7).trim();
    }
    return trimmed;
  }
  const headerToken = req.header("x-guest-token");
  if (typeof headerToken === "string" && headerToken.trim().length > 0) {
    return headerToken.trim();
  }
  if (
    typeof req.body === "object" &&
    req.body !== null &&
    "guestToken" in req.body
  ) {
    return (req.body as Record<string, unknown>).guestToken;
  }
  if (typeof req.query?.guestToken === "string") {
    return req.query.guestToken;
  }
  return undefined;
}

function stripGuestTokenFromBody(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {};
  }
  const copy: Record<string, unknown> = {
    ...(body as Record<string, unknown>)
  };
  delete copy.guestToken;
  return copy;
}

function mapActionCodeToStatus(code: string): number {
  switch (code) {
    case "GUEST_SESSION_REQUIRED":
    case "GUEST_TOKEN_INVALID":
    case "GUEST_TOKEN_MALFORMED":
      return 401;
    case "CHARACTER_OWNERSHIP_FORBIDDEN":
      return 403;
    case "CHARACTER_NOT_FOUND":
      return 404;
    case "CHARACTER_ALREADY_CONFIRMED":
    case "CHARACTER_NOT_CONFIRMED":
    case "ROLL_DRAFT_EXPIRED":
    case "ROLL_NONCE_MISMATCH":
    case "IDEMPOTENCY_CONFLICT":
      return 409;
    default:
      return 400;
  }
}

export function registerCharacterHttpRoutes(
  options: RegisterCharacterHttpRoutesOptions
): void {
  const { app, db, getEngine } = options;

  const handleRoster = async (req: Request, res: any): Promise<void> => {
    try {
      const rawToken = extractGuestTokenFromRequest(req);
      const verified = await db.guestIdentity.verifyGuestToken(rawToken);
      if (!verified.ok) {
        const failPayload: CharacterRosterResponsePayload = {
          ok: false,
          code: verified.code,
          messageVi: "Chứng chỉ danh tính khách v0.2 không hợp lệ.",
          characters: []
        };
        res.status(401).json(failPayload);
        return;
      }

      const characters = await db.listCharacterRoster(verified.accountId);
      const firstConfirmed = characters.find(
        (c) => c.creationState === "confirmed"
      );
      const lastSelectedCharacterId =
        firstConfirmed?.characterId ?? characters[0]?.characterId ?? null;

      const okPayload: CharacterRosterResponsePayload = {
        ok: true,
        code: "OK",
        messageVi: "Đã tải danh sách nhân vật v0.2 thành công.",
        accountId: verified.accountId,
        characters,
        lastSelectedCharacterId
      };
      res.status(200).json(okPayload);
    } catch (err) {
      res.status(500).json({
        ok: false,
        code: "INTERNAL_ERROR",
        messageVi: String(err),
        characters: []
      } satisfies CharacterRosterResponsePayload);
    }
  };

  app.get("/api/v02/characters/roster", handleRoster);
  app.post("/api/v02/characters/roster", handleRoster);

  app.post("/api/v02/characters/draft", async (req, res) => {
    try {
      const rawToken = extractGuestTokenFromRequest(req);
      const verified = await db.guestIdentity.verifyGuestToken(rawToken);
      if (!verified.ok) {
        const reqId =
          typeof req.body?.requestId === "string"
            ? req.body.requestId.slice(0, 128)
            : "";
        res.status(401).json({
          requestId: reqId,
          ok: false,
          code: verified.code,
          messageVi: "Chứng chỉ danh tính khách v0.2 không hợp lệ."
        } satisfies CharacterV02ActionResultPayload);
        return;
      }

      const cleanBody = stripGuestTokenFromBody(req.body);
      const result = await db.characterV02Actions.createCharacterDraft(
        verified.accountId,
        cleanBody,
        db.getCharacterV02ActionDefaults()
      );
      res.status(result.ok ? 200 : mapActionCodeToStatus(result.code)).json(result);
    } catch (err) {
      res.status(500).json({
        requestId: "",
        ok: false,
        code: "INTERNAL_ERROR",
        messageVi: String(err)
      } satisfies CharacterV02ActionResultPayload);
    }
  });

  app.post("/api/v02/characters/:characterId/reroll", async (req, res) => {
    try {
      const rawToken = extractGuestTokenFromRequest(req);
      const verified = await db.guestIdentity.verifyGuestToken(rawToken);
      const reqId =
        typeof req.body?.requestId === "string"
          ? req.body.requestId.slice(0, 128)
          : "";
      if (!verified.ok) {
        res.status(401).json({
          requestId: reqId,
          ok: false,
          code: verified.code,
          messageVi: "Chứng chỉ danh tính khách v0.2 không hợp lệ."
        } satisfies CharacterV02ActionResultPayload);
        return;
      }

      const paramCharacterId = String(req.params.characterId ?? "").trim();
      const cleanBody = stripGuestTokenFromBody(req.body);
      if (
        cleanBody.characterId !== undefined &&
        cleanBody.characterId !== paramCharacterId
      ) {
        res.status(400).json({
          requestId: reqId,
          ok: false,
          code: "FORGED_INPUT_REJECTED",
          messageVi: "ID nhân vật trong thân yêu cầu không khớp với đường dẫn."
        } satisfies CharacterV02ActionResultPayload);
        return;
      }

      const result = await db.characterV02Actions.rollInnateDestiny(
        verified.accountId,
        {
          ...cleanBody,
          characterId: paramCharacterId
        },
        db.getCharacterV02ActionDefaults()
      );
      res.status(result.ok ? 200 : mapActionCodeToStatus(result.code)).json(result);
    } catch (err) {
      res.status(500).json({
        requestId: "",
        ok: false,
        code: "INTERNAL_ERROR",
        messageVi: String(err)
      } satisfies CharacterV02ActionResultPayload);
    }
  });

  app.post("/api/v02/characters/:characterId/confirm", async (req, res) => {
    try {
      const rawToken = extractGuestTokenFromRequest(req);
      const verified = await db.guestIdentity.verifyGuestToken(rawToken);
      const reqId =
        typeof req.body?.requestId === "string"
          ? req.body.requestId.slice(0, 128)
          : "";
      if (!verified.ok) {
        res.status(401).json({
          requestId: reqId,
          ok: false,
          code: verified.code,
          messageVi: "Chứng chỉ danh tính khách v0.2 không hợp lệ."
        } satisfies CharacterV02ActionResultPayload);
        return;
      }

      const paramCharacterId = String(req.params.characterId ?? "").trim();
      const cleanBody = stripGuestTokenFromBody(req.body);
      if (
        cleanBody.characterId !== undefined &&
        cleanBody.characterId !== paramCharacterId
      ) {
        res.status(400).json({
          requestId: reqId,
          ok: false,
          code: "FORGED_INPUT_REJECTED",
          messageVi: "ID nhân vật trong thân yêu cầu không khớp với đường dẫn."
        } satisfies CharacterV02ActionResultPayload);
        return;
      }

      const result = await db.characterV02Actions.confirmInnateDestiny(
        verified.accountId,
        {
          ...cleanBody,
          characterId: paramCharacterId
        },
        db.getCharacterV02ActionDefaults()
      );
      res.status(result.ok ? 200 : mapActionCodeToStatus(result.code)).json(result);
    } catch (err) {
      res.status(500).json({
        requestId: "",
        ok: false,
        code: "INTERNAL_ERROR",
        messageVi: String(err)
      } satisfies CharacterV02ActionResultPayload);
    }
  });

  app.post("/api/v02/characters/:characterId/select", async (req, res) => {
    try {
      const rawToken = extractGuestTokenFromRequest(req);
      const verified = await db.guestIdentity.verifyGuestToken(rawToken);
      if (!verified.ok) {
        res.status(401).json({
          ok: false,
          code: verified.code,
          messageVi: "Chứng chỉ danh tính khách v0.2 không hợp lệ."
        } satisfies SelectCharacterForWorldEntryResultPayload);
        return;
      }

      const paramCharacterId = String(req.params.characterId ?? "").trim();
      const cleanBody = stripGuestTokenFromBody(req.body);
      for (const key of Object.keys(cleanBody)) {
        if (key !== "requestId" && key !== "characterId") {
          res.status(400).json({
            ok: false,
            code: "FORGED_INPUT_REJECTED",
            messageVi: `Trường '${key}' bị cấm trong yêu cầu chọn nhân vật.`
          } satisfies SelectCharacterForWorldEntryResultPayload);
          return;
        }
      }
      if (
        cleanBody.characterId !== undefined &&
        cleanBody.characterId !== paramCharacterId
      ) {
        res.status(400).json({
          ok: false,
          code: "FORGED_INPUT_REJECTED",
          messageVi: "ID nhân vật trong thân yêu cầu không khớp với đường dẫn."
        } satisfies SelectCharacterForWorldEntryResultPayload);
        return;
      }

      const actionDefaults = db.getCharacterV02ActionDefaults();
      const owned = await db.getOwnedCharacterV02ById(
        verified.accountId,
        paramCharacterId,
        {
          destinyCatalog: actionDefaults.destinyCatalog
        }
      );
      if (!owned) {
        const existingOther = await db.getCharacterV02ById(paramCharacterId, {
          destinyCatalog: actionDefaults.destinyCatalog
        });
        if (existingOther) {
          res.status(403).json({
            ok: false,
            code: "CHARACTER_OWNERSHIP_FORBIDDEN",
            messageVi: "Nhân vật không thuộc quyền sở hữu của tài khoản này."
          } satisfies SelectCharacterForWorldEntryResultPayload);
          return;
        }
        res.status(404).json({
          ok: false,
          code: "CHARACTER_NOT_FOUND",
          messageVi: "Không tìm thấy nhân vật v0.2 được chỉ định."
        } satisfies SelectCharacterForWorldEntryResultPayload);
        return;
      }

      if (owned.identity.creationState !== "confirmed") {
        res.status(409).json({
          ok: false,
          code: "CHARACTER_NOT_CONFIRMED",
          messageVi:
            "Nhân vật chưa hoàn tất xác nhận Tiên Thiên Khí Vận, không thể tiến vào Bát Hoang."
        } satisfies SelectCharacterForWorldEntryResultPayload);
        return;
      }

      const snapshot = toCharacterV02Snapshot(
        owned,
        actionDefaults.destinyCatalog
      );
      const safeCoords = getEngine().resolveSafeZoneCoordinates(
        snapshot.world.zoneId,
        snapshot.world.x,
        snapshot.world.y
      );

      res.status(200).json({
        ok: true,
        code: "OK",
        messageVi: "Đã chọn nhân vật để tiến vào Bát Hoang.",
        character: snapshot,
        targetZoneId: snapshot.world.zoneId,
        spawnX: safeCoords.x,
        spawnY: safeCoords.y
      } satisfies SelectCharacterForWorldEntryResultPayload);
    } catch (err) {
      res.status(500).json({
        ok: false,
        code: "INTERNAL_ERROR",
        messageVi: String(err)
      } satisfies SelectCharacterForWorldEntryResultPayload);
    }
  });

  const handleDeleteCharacter = async (req: Request, res: any): Promise<void> => {
    try {
      const rawToken = extractGuestTokenFromRequest(req);
      const verified = await db.guestIdentity.verifyGuestToken(rawToken);
      const reqId =
        typeof req.body?.requestId === "string"
          ? req.body.requestId.slice(0, 128)
          : `del_${Date.now()}`;
      if (!verified.ok) {
        res.status(401).json({
          requestId: reqId,
          ok: false,
          code: verified.code,
          messageVi: "Chứng chỉ danh tính khách v0.2 không hợp lệ."
        } satisfies CharacterV02ActionResultPayload);
        return;
      }

      const paramCharacterId = String(req.params.characterId ?? "").trim();
      const cleanBody = stripGuestTokenFromBody(req.body);
      if (
        cleanBody.characterId !== undefined &&
        cleanBody.characterId !== paramCharacterId
      ) {
        res.status(400).json({
          requestId: reqId,
          ok: false,
          code: "FORGED_INPUT_REJECTED",
          messageVi: "ID nhân vật trong thân yêu cầu không khớp với đường dẫn."
        } satisfies CharacterV02ActionResultPayload);
        return;
      }

      const result = await db.characterV02Actions.deleteCharacter(
        verified.accountId,
        {
          requestId: reqId,
          characterId: paramCharacterId
        },
        db.getCharacterV02ActionDefaults()
      );
      res.status(result.ok ? 200 : mapActionCodeToStatus(result.code)).json(result);
    } catch (err) {
      res.status(500).json({
        requestId: "",
        ok: false,
        code: "INTERNAL_ERROR",
        messageVi: String(err)
      } satisfies CharacterV02ActionResultPayload);
    }
  };

  app.post("/api/v02/characters/:characterId/delete", handleDeleteCharacter);
  app.delete("/api/v02/characters/:characterId", handleDeleteCharacter);
}
