# SYS-NAVIGATION — Quest Objective Auto-Travel Without Auto-Quest

> TD-03 v0.5 | **OWNER_REVIEW_REQUIRED** | Authority `GD-003`, `GD-004`, `GD-035`, `GD-036` and baseline `WORLD_DESIGN.md` / `UX_DESIGN.md`.
> Explicit dependency: combat automation in `AUTO_FARM.md`; quest routing in `QUEST_ENGINE.md`. Zone/portal content and authoring belong to TD-04.

## 1. Navigation is movement only

**Approved behavior**: From the compact quest tracker or `Q` journal, a player selects a quest objective and activates "Tự tìm đường". The game moves the player along lawful walkable Tiled ground, optionally along legal world graph connections, then **STOPS NEAR THE OBJECTIVE**. The player must personally perform any NPC conversation, item turn-in, quest acceptance, branch choice, puzzle, secret unlock or manual gathering interaction. Route discovery must not reveal hidden story locations the character has not discovered.

There is **NO `autoQuest` API**. `navigateToQuestObjective` is just an explicitly-scoped movement request tied to a real player-selected objective. Never infer authorization to complete a quest from authorization to travel. Ordinary combat-driven kill-count objectives can progress independently under authorized online Auto Farm, but initiating Auto Navigation switches character mode away from Auto Farm.

## 2. Inputs and outputs

```ts
export interface NavigateToQuestObjectiveIntent {
  questId: string;
  objectiveId: string;
  expectedQuestRevision: number;
  requestId: string;
}

export type NavigationState =
  | "IDLE" | "PLANNING" | "MOVING" | "WAITING_FOR_PORTAL"
  | "ARRIVED" | "BLOCKED" | "CANCELED";

export interface NavigationSnapshot {
  navigationId: string;
  state: NavigationState;
  questId: string;
  objectiveId: string;
  currentZoneId: string;
  destinationHint: string;
  routeRemainingTiles: number | null;
  failureCode: string | null;
}
```

**Intent does not accept arbitrary `x/y` or teleport requests**. `goal` is resolved server-side from a typed, unlocked `QuestObjectiveDef` and `ZoneDef`: `locationRef` → approach tile(s) → optional permitted zone transitions. Absolute coordinates and objective tags are registry/authored data, not trusted from the client. A general user-click-to-move command (if added) is separate and still server validated.

Potential failure codes: `QUEST_NOT_ACCEPTED`, `OBJECTIVE_NOT_ACTIVE`, `SECRET_LOCATION_UNKNOWN`, `ROUTE_UNAVAILABLE`, `ZONE_LOCKED`, `PORTAL_REQUIRES_INTERACTION`, `SERVER_PATH_TIMEOUT`, `ACTIVITY_INTERRUPTED`, `ARRIVAL_READY`. Do not leak coordinates of secret NPCs in error payloads.

## 3. Map pathfinding contract

- Use actual `32x32` Tiled collision/portal layers from current `maps/tan_thu_thon.tmj` and `maps/thanh_truc_lam.tmj` with walkability derived from **authoritative map data**, not tile color. Tiled `Ground` art is not proof of walkability, and `AbovePlayer` is visual occlusion, not a walkable flag.
- Recommended first slice: deterministic A* on a 4-neighbor or validated 8-neighbor grid. If diagonal steps used, prevent diagonal corner cutting through colliders. Select nearest legal **approach tile** adjacent to target NPC/object within configured interaction radius; never path to NPC's occupied tile.
- Proposed `planningBudget`: ≤2ms of server CPU per initial small-map route or return a throttled `PLANNING` response; never block authoritative Colyseus simulation on an unbounded A* scan. Replanning is bounded (candidate up to 2 per 10s) and triggered by meaningful changes, not every tick.
- Server validates every actual movement segment by existing collision/velocity authority. The polyline guides movement; it does not confer permission to cross a wall. No client-supplied final position, no instant move along a path, no moving while disconnected.
- If dynamic obstacles are present, stop/replan; return `BLOCKED` if no legal route. Require expected quest revision and check objective availability on each zone transition. No arbitrary monster avoidance guarantee: route may intersect a dangerous area; route preview should flag authored danger bands.

## 4. Cross-zone travel through portals

The world is a graph: nodes = unlocked `ZoneId` and portals, edges = authored transitions validated by the server. A path spanning two zones comprises walkable local route → portal transition → walkable destination route.

**DESIGN_BASELINE for approval**: a **public, already unlocked, non-interactive transit portal** may be traversed automatically by navigation through the same server-side portal validation method as a manual traversal. A **locked/story/decision/dungeon/party-gated portal** MUST stop at `WAITING_FOR_PORTAL` and ask the player to explicitly interact or make a choice. Portal traversal is movement, not automatic quest completion. No loading the destination zone without real room transfer/authoritative arrival.

**Current two-zone example**: `tan_thu_thon` portal → `thanh_truc_lam`. A selected *visible/unlocked* NPC or hunting-area objective may route through this existing bidirectional portal. Upon arrival near the objective, activity becomes `IDLE` and UI shows `Đã đến nơi — hãy tương tác/thực hiện nhiệm vụ`. If objective location is concealed by story, show a general clue instead and do not generate a route.

## 5. Movement arbitration and activity transitions

`AUTO_NAVIGATE` is mutually exclusive with `AUTO_FARM`, `MEDITATION`, active manual dialogue/puzzle interactions. A navigation request:

1. Validates authenticated controller epoch and quest objective.
2. Stops Auto Farm before planning movement.
3. Builds route, returns status `PLANNING`/`MOVING`.
4. Applies server-authorized movement; updates camera/client projection normally.
5. Arrives within authored approach tolerance and **stops**.

Manual movement cancels current route immediately. Pressing Stop/Esc may cancel. Selecting a *different* quest objective replaces the route after invalidating previous `navigationId`. If quest is completed, reset, expired, party transferred, server zone unloaded or hidden objective reveal revoked, invalidate route; the client never keeps walking on a stale map marker. On disconnect, movement stops; **no offline travel/catch-up path simulation**. Reconnect returns to normal position/zone persisted at last committed authoritative segment, with mode `IDLE`.

## 6. UI interaction and accessibility

- Quest tracker small and unobtrusive; highlight active entry. `Q` opens full journal with five categories: **Chính tuyến, Phụ tuyến, Đặc biệt, Hằng ngày, Bảng nhiệm vụ thành trấn**.
- `Tự tìm đường` must be a distinct affordance from `Nhận`, `Nộp`, `Chọn`, `Bắt đầu bí cảnh`. Never create a unified "Auto" button that implicitly invokes all actions.
- Show destination/route length or hidden-location hint, map boundary and current route status without exposing secret world coordinates.
- A fullscreen dialogue/menu interaction must capture keyboard focus: pressing Q while typing chat does not toggle journal; keyboard input should not accidentally move/attack during story choice.
- If map collision/path algorithm requires new path-hint art, TD-05's human approval gate controls the visual. TD-03 specifies function only.

## 7. Server-only completion semantics

`navigation_arrived` is **not** a quest-completion event by default. A quest may have an explicitly-authored **`visit` objective** where arriving at the correct server-validated location legitimately increments the objective — that is a fact of traveling, *not* an automatic story action. Reaching a character/NPC never automatically grants `talk`, `deliver`, `submit`, `accept`, `choose`, `craft`, `interact` or `dungeon_clear` objective credit. This precise distinction prevents both auto-quest exploits and UX confusion.

## 8. Acceptance tests

| ID | Input | Expected |
|---|---|---|
| NAV-01 | Selected active quest objective, reachable same zone | Legal stepwise route; stop adjacent within interaction radius, no NPC interaction |
| NAV-02 | Objective in other zone via public portal | Only validated zone transition; no teleport; route resumes from real spawn |
| NAV-03 | Locked/choice portal | Stop with `WAITING_FOR_PORTAL`; player decision required |
| NAV-04 | Hidden/undiscovered objective | No route or secret coordinates disclosed |
| NAV-05 | Client supplies forged coordinates / old quest revision | Reject, no movement |
| NAV-06 | Path crosses collision wall/diagonal corner | Correct reroute or `BLOCKED`, never clip |
| NAV-07 | Manual movement or Stop during route | Route canceled immediately |
| NAV-08 | Start Auto Farm while navigating | Navigation canceled; only one active mode |
| NAV-09 | Disconnect mid-route | No further movement; reconnect `IDLE`, no catch-up |
| NAV-10 | Arrive at NPC needing `talk`/`submit` | Counts unchanged, waiting for manual interaction |
| NAV-11 | Arrive in authored `visit` region | Only eligible active visit objective credited exactly once |
| NAV-12 | Portal/zone transfer race, outdated navigation ID | No double transfer, duplicate arrival, missing collision authority |

## 9. Open dependencies

TD-04 must supply: `QuestObjectiveDef.locationRef`, discovery state and reveal conditions, `ZoneDef` world graph, portal permission type, `approachRadiusPx`, route eligibility/locks and stable coordinate registry. TD-05 supplies route UX design plus actual in-engine approval. Cross-zone auto transit for public portals remains a **reviewed DESIGN_BASELINE**, not a canon statement.
