# TD-05 · Implementation Migration & Visual QA Tests

> v0.7 · DESIGN_BASELINE · This is a future implementation plan. It neither changes existing source nor claims verified browser results. It does not authorize paid image routes or forced regeneration.

## 1. Existing code/art baseline to preserve

| Existing evidence / contract | Observed state | TD-05 integration rule |
|---|---|---|
| Phaser 4.2.1 client, Tiled `.tmj`, `WorldScene.ts` | Prototype supports first 2 maps | Add content-key ↔ display binding and scene art without rewriting authoritative position/collision |
| Tiled map tile grid | `32×32` in starter zones | Keep logical coordinate system and portal/mob collision; upgrade *visual tiles*, not world coordinates indiscriminately |
| Three character upgrades | `80×96` frames, `480×1920` sheets at anchor `(0.5,0.9167)` | Use tested format where appropriate; creature rigs may require accepted alternative geometry |
| Nine legacy actor/monster sheets | `48×64` and affine/static-derived | Keep tagged PLACEHOLDER until reviewed, preserve source & previous visual refs |
| `thai_tai`, `gia_bao` | Inherited sprite aliases | Must get own generated silhouette + portrait before final release |
| `chatdvt` | Jade-cyan four-legged spirit beast identity | Never generate humanoid or human-pose sprite; verify against character visual bible |
| `assets/manifest.json` & `assets/provenance.json` | Current v2.0 technical asset verification | Extend without resetting historical meaning; add separate owner visual approval/evidence refs |
| `.agents/skills/ai-art-production/SKILL.md` | Existing project-specific helper | Read/reuse, do not overwrite blindly or assume undocumented CLI options |
| Legacy static terrain tiles and VFX | Programmatic placeholders noted in Art Bible | Create genuine generated replacements, preserve temporary runtime originals until human approval |
| Existing manual/combat input paths | Historic v0.1 interaction models | TD-01→TD-04 authority decides new behavior; TD-05 only makes approved behavior visible |

## 2. Non-destructive migration strategy

1. Inventory all current runtime textures, atlas frames, Tiled tileset GIDs, source-generation history, visual status and references. Back up map data, current source sheets and content manifests before changing any art pipeline.
2. Build an **art-only data manifest/visual binding** alongside existing registries; use stable content IDs and semantic visual roles. Do not generate code-owned image sources. Missing required art is represented as MISSING/PENDING, never a fabricated `HUMAN_APPROVED` placeholder.
3. Preserve image source originals and stable runtime asset keys until dependent scene code and tests are migrated; add a new key/version to avoid breaking older snapshots when necessary.
4. Replace **one controlled sample**: one street segment + one market facade/vendor + one readable icon/VFX. Demonstrate the full `ContentDef → source → processed asset → Phaser/Tiled binding → screenshot → sign-off` chain.
5. Validate anchor frames, hitboxes, Tiled collision and portal/spawn traversability; update map assets by reviewed semantic batches (not a global blind tileset replacement).
6. Gradually upgrade legacy character sheets by content priority; preserve 10 Legendary IDs, unique silhouettes and NPC story secrecy. Upgrade beast and monsters with appropriate animation rigs, not the humanoid template by force.
7. Update `assets/provenance.json`, `assets/manifest.json`, scene bindings and review evidence. Require explicit art approval of each release batch; never silently flip existing manifest's historical technical `approved` to visual `HUMAN_APPROVED`.
8. Roll out separately from TD-01/02/03 gameplay migrations, or integrate in small feature vertical slices once the unified Design Freeze is imported; do not combine destructive DB migration with global asset rebuild.

**Rollback plan:** keep previous runtime assets, atlases and map snapshots available, ensure manifest versions and scene references can restore a previously working playtest; do not remove raw AI sources or user-created hand adjustments.

## 3. Planned tooling and commands — no invented guarantees

- Existing canonical commands include `npm run verify:assets`, `npm test`, `npm run typecheck`, `npm run build`; run them on the implementation branch and record actual exit codes.
- Validate asset paths and SHA-256 (input and output), tile dimensions, animation state/frame indices, runtime atlas keys and Tiled GIDs; use installed sprite/AI-art skills only after inspecting the actual scripts.
- Use real Playwright/two-browser screenshots and manually inspect animations at normal zoom. Verify that expected `npm run test:e2e` exists and works in the actual current `package.json` before claiming it passed; if unavailable, run documented alternative with evidence.
- A no-image-generation / no-source-art environment is a **BLOCKED** condition for production art, not an invitation to draw box/grass/character assets through Pillow/SVG/CSS as a final substitute.

## 4. Technical and visual test plan

| ID | Test subject | Required assertion | Test layer |
|---|---|---|---|
| `T5-01` | New NPC | Actual actor sprite/portrait + semantic ID + valid spawn; no random reused Legendary alias | Registry + scene screenshot |
| `T5-02` | ChatDVT | Four-legged jade-cyan silhouette stays consistent across poses | Owner visual + atlas inspection |
| `T5-03` | Monster | Walk, tell, attack, hurt and death recognizably animate in-world | Browser recording |
| `T5-04` | New zone | Tiled layered scene, terrain/props/roof/collision and safe portal traversal | Map validator + browser |
| `T5-05` | New item | Valid semantic icon in inventory/shop; world drop representation when applicable | Content/asset registry + UI |
| `T5-06` | New Võ kỹ | Icon + actor cast/attack + hit/telegraph/impact VFX bound to authoritative event | Combat integration + playback |
| `T5-07` | New Công pháp | Readable illustrated manual and meaningful cultivation/meditation visual | UI + browser |
| `T5-08` | Quest | Real reachable world objective/board/NPC and completion cue | TD-03 route + browser |
| `T5-09` | Tụ Bảo Các | Physical facade/entrance/vendor with manual browse, search, buy/sell | Map + TD-04 ShopService |
| `T5-10` | Specialist vendor | Distinct stall/sign and filtered shared catalog; no hidden global item sale | TD-04/05 integration |
| `T5-11` | No P2P | No player trade, auction, escrow or consignment UI/endpoints in scope | Scope / API test |
| `T5-12` | Ground loot | One item reward path with visible ground sprite and no duplicate direct grant | TD-04 reward integration |
| `T5-13` | Direct loot | Distinct visual reward cue with no duplicate world drop grant | TD-04 reward integration |
| `T5-14` | Destiny/rarity | Exactly four Destiny grades shown; Legendary art not leaked through wrong shop | UI / registry |
| `T5-15` | Technique/rarity | Exactly six Technique grades; no `Thánh` quality invented | UI / registry |
| `T5-16` | DAO | Correct six paths and 10 stages; trials have real encounter visuals | TD-02 + browser |
| `T5-17` | LV / Tu Vi | Independent Level EXP vs realm stage/Tu Vi bars | TD-01 + browser |
| `T5-18` | Auto online | Connected actor animation reflects actual server combat; disconnect stops | TD-03 + two browsers |
| `T5-19` | No Auto Quest | Navigation stops near visual objective; no auto-click or auto submission | TD-03 + E2E |
| `T5-20` | Human art gate | Technical PASS never promotes art to `HUMAN_APPROVED` | Art ledger/CI policy |
| `T5-21` | Source provenance | All final art traces to genuine generated originals and hashes | Manifest/script audit |
| `T5-22` | Reference scene | Captures at 1280×720 and 390×844 are from actual running app | Playtest evidence |
| `T5-23` | World-first HUD | All panels closed shows coherent inhabited map; no always-on dashboard | Human screenshot review |
| `T5-24` | VN typography | Diacritics, small text, category names and item tooltip readable | Browser QA |
| `T5-25` | Zoom/scale | Feet/hitboxes/colliders align at camera zoom; creatures keep anatomy | Sprite/playtest |
| `T5-26` | Source secrecy | Masked immortal not named Phì Đế; Ăn Uống Thiên Tôn secret not exposed early | Content/style/spoiler audit |
| `T5-27` | Quest gating | Public all-10-Legend main path visible without Legendary signature; True Disciple remains exclusive | TD-04/05 |
| `T5-28` | Error states | Missing assets produce visible build/release error instead of silent substitute texture | Validator/loader |
| `T5-29` | Performance | Representative scene and VFX measured on chosen hardware profile; no invented baseline pass | Real-browser profiling |
| `T5-30` | Rerender/rollback | Replacement asset version can be reverted without corruption of old map or previous saves | Smoke/backup restore |

## 5. Risk register for Argon implementation plan

- `VIS-RISK-01` Stiff 4×4 static generation with clothing/body jitter; cannot be solved by PNG size validation alone. Gate animation samples for human view.
- `VIS-RISK-02` Mismatched scale between legacy and new frames; define per-archetype world footprint/anchor rather than enlarge every creature uniformly.
- `VIS-RISK-03` Tiled tileset upgrade shifts atlas/GIDs and breaks collision/portal; use controlled mapping & real route regression tests.
- `VIS-RISK-04` Shop marketplace scope inflation into player trading; forbid until explicit separate decision.
- `VIS-RISK-05` UI density overwhelms scenery; screenshot test with no panels and typical gameplay panel states.
- `VIS-RISK-06` Source generation blocked or unapproved paid provider; stop the art stage and show blocker, do not fake final output.
- `VIS-RISK-07` Old `status:approved` metadata misread as human sign-off; maintain separate explicit owner ledger.
- `VIS-RISK-08` Scene performance degraded by large sheets/VFX/decor; profile actual loaded runtime, not folder size alone.

**Documentation sign-off ≠ visual asset sign-off ≠ production release.**
