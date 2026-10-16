# TD-FREEZE-APPROVALS — Explicit owner decisions, provisional parameters and unresolved content

> Updated after TD-05 approval. This table supplements, **never replaces**, the binding `docs/DECISIONS.md` v0.2 and the Phase 1A artistic approval ledger.

| Ref | Review outcome | Binding implementation meaning | Remains provisional/open |
|---|---|---|---|
| TD-01-APP | Accepted | Six origin stats Thể Phách / Lực Đạo / Linh Tính / Thân Pháp / Thần Thức / Ngộ Tính; each actual Level +1 allocatable point; EXP vs Tu Vi separated; no XP overflow banking at capped non-Saint major realm; 17 realms + Phàm Nhân | Origin stat 10 each, `1.50^r` stage multiplier, numerical caps/derived coefficients are testable baselines not final economy/combat balance; backup/archive prototype saves must be non-destructive and implementation authorized |
| TD-02-APP | Accepted | Six Dao **Kiếm Đạo / Đao Đạo / Chỉ Đạo / Chưởng Đạo / Thể Tu / Pháp Tu**, ten Dao stages, trials 3→4, 6→7, 9→10; six tiers Phàm/Linh/Hoàng/Địa/Thiên/Thần for both Công pháp and Võ kỹ; combat server-authoritative with fixed monster difficulty bands | Dao EXP coefficients, HP/DEF formulas, loadout slots, realm oppression factors and simulated build encounters remain tuning baselines |
| TD-03-APP | Accepted | Online-only Auto Farm; disconnected actor cannot farm nor be back-paid; auto navigation reaches and stops; NO Auto Quest, manual NPC dialogue/quest accept/turn-in/branching | Scheduler 5Hz, potion HP 35%/MP 20%, 320px pursuit, single-controller timeout and explicit pre-logout bế quan start need in-engine proof / product-level approval before production |
| TD-04-APP | Accepted | World/item/quest/affinity/Food Catalog registries, source-event identity/one delivery per reward, public Main Quest independent of private six-chapter Legendary paths | 18 food examples are not a full released catalog; Phì Đế's private food threshold is UNRESOLVED; NPC affinity thresholds, item rarity/equipment rarity, party loot policy and reset hour unresolved |
| TD-04-SHOP-APP | **Accepted — explicit** | NPC BUY/SELL only; physical Tụ Bảo Các town hub + specialist Đan Dược/Tàng Kinh/Binh Khí/Linh Trù access, shared `ShopService`, server-priced local offers/search/filter, manual interaction | No player-to-player trading, listing, consignment, escrow, auction/bidding, player market or RMT. Static stock/finite restock, sale prices and hall-vs-stalls layout not finalized |
| TD-05-APP | **Accepted — explicit** | Every NEW player-visible content object must have render role, asset/source pipeline, visible response and in-game evidence. No production release on popup-only text. Human approval required for visual quality | Candidate A palette and existing PoC sprites remain `TECHNICALLY_VERIFIED` / `PROPOSED`, NOT `HUMAN_APPROVED`; route/provider and ability to generate specific future art not guaranteed |

## Stable canon and confidentiality

- Ten Legendary NPCs and exact realm IDs. `dam_lon_tien_tu` stays `UNKNOWN`. ChatDVT is a **jade-cyan four-legged spirit beast**, not a human.
- Exactly one different protected Legendary signature owned across **Tiên Thiên** and **Hậu Thiên** sources; no merchant, public quest or loot may bypass. A matching signature is only the first of multiple True Disciple gates. Common Main Quest is open to everyone.
- Phì Đế = Ăn Uống Thiên Tôn incarnation is an APPROVED late-game public reveal, **not** an intro/cosmetic splash spoiler. Masked mentor identity unresolved.
- `GD-046` seven macro arcs, era title Thiên Kiêu Kỷ Nguyên, Hư Tịch Giới and Dạ Vô Uyên are PROPOSED writer scaffolding, not canon locked by this Freeze.
- Art/scene release requires genuine generated source artwork and explicit human approval. Python postprocessing is allowed; programmatic drawing of production images as a substitute is prohibited.

## Domain-specific validity

- Four destiny rarity tiers: **Phàm / Hoàng / Tiên / Thần**.
- Six technique rarity tiers: **Phàm / Linh / Hoàng / Địa / Thiên / Thần**.
- Equipment tier scheme requires separate owner decision. A random shop/catalog must never fill a missing tier by copying another system's enum.
- At Phàm Nhân Lv10 player manually follows masked mentor quest and breakthrough. At Thánh Cảnh Lv351+ there is no new playable major realm.
- BUY/SELL to NPC is a deliberate player action. Auto Farm and navigation never purchase, sell, learn manuals or select quest options.

## Decision status precedence

`AGENTS.md` and `RULES.md` for safety/canon/asset governance → `docs/DECISIONS.md` for established approved mechanics → this **TD Freeze ledger** for later owner-approved technical scope → domain specs' explicit numerical `DESIGN_BASELINE`/`PROPOSED` flags → legacy reports/prototype as implementation evidence, not authority. Any genuine conflict must be listed to owner; do not invent a resolution to force a PASS.
