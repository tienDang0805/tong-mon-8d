# S1-E Starter Tiên Thiên Destiny Catalog (`s1e-starter-v1.0`)

> **Version**: `s1e-starter-v1.0` | **Task**: `S1-E` | **Owner Decision Scope**: 14 Ordinary `Tiên Thiên` definitions (`APPROVED` IDs/names/rarities + `DESIGN_BASELINE` flat pre-realm attribute bonuses) + `van_vi_dao_thai` (`phi_de`, `APPROVED`) + 1 development-trial Legendary signature `huyen_anh_dao_thai` (`dam_lon_tien_tu`, `APPROVED` for S1-E development/verification, `narrativeState: "NOT_DESIGNED"`, preserving `dam_lon_tien_tu.realmId = "UNKNOWN"`).

---

## 1. Governance & Approval Boundaries

1. **Trait Identity & Rarity (`ownerApprovalState: "APPROVED"`)**:
   - The 14 ordinary `Tiên Thiên` trait IDs, Vietnamese display names, and 4-tier rarities (`pham`, `hoang`, `tien`, `than`) are owner-approved for `S1-E`.
   - `van_vi_dao_thai` (`Vạn Vị Đạo Thai`) remains the canonical Legendary signature bound to `phi_de` (`GD-016`).
   - `huyen_anh_dao_thai` (`Huyễn Ảnh Đạo Thai`) is owner-authorized as the second `Thần Phẩm` Legendary signature bound to `dam_lon_tien_tu` strictly for `S1-E` development and multi-signature invariant verification (`narrativeState: "NOT_DESIGNED"`). `dam_lon_tien_tu.realmId` remains `"UNKNOWN"` (`Bất Minh`), and no new questline, story chapter, or master-disciple progression is introduced.
2. **Numeric Attribute Bonuses (`bonusApprovalState: "DESIGN_BASELINE"`)**:
   - Flat pre-realm attribute bonuses (`flatPreRealmAttributeBonuses`) are provisional `DESIGN_BASELINE` candidates folded into `preRealmAttributes -> effectiveAttributes -> derivedStats` in `computeCandidateBaselineStatSnapshot` (`packages/game-data/src/td01Numeric.ts`).
   - Confirmed `Tiên Thiên` traits and active `Hậu Thiên` traits in the 3 equipped slots contribute their flat pre-realm bonuses; unequipped `Hậu Thiên` collection entries do not.

---

## 2. Roll Distribution & Full-Triple Rejection Sampling (`GD-010`, `GD-014`, `GD-017`)

- **Per-Slot Base Rarity Weights (`DESIGN_BASELINE`)**:
  - `pham`: `5000` (`50%`)
  - `hoang`: `3000` (`30%`)
  - `tien`: `1500` (`15%`)
  - `than`: `500` (`5%`)
- **Inside `Thần` Sub-Pool (`GD-017`)**:
  - `CANDIDATE_THAN_SIGNATURE_WEIGHT = 60` (`60%` Legendary signature sub-pool)
  - `CANDIDATE_THAN_ORDINARY_WEIGHT = 40` (`40%` ordinary `Thần` sub-pool)
- **Full-Triple Independent Rejection Sampling (`rollInnateDestinyTripleFromCatalog`)**:
  - Draws 3 independent candidate slots (`drawIndependentCandidateSlot`).
  - Rejects and redraws the entire 3-trait candidate batch if:
    1. Any two slots contain duplicate trait IDs, OR
    2. More than 1 slot is `kind === "legendary_signature"`, OR
    3. Any slot's `legendaryNpcId` collides with `existingOwnedSignatureNpcId`.

---

## 3. Canonical Starter Catalog Table (`S1E_STARTER_DESTINY_CATALOG`)

| # | ID | Display Name (VI) | Rarity | Kind | Legendary NPC | Candidate Pre-Realm Bonuses (`DESIGN_BASELINE`) | Narrative State |
|---|---|---|---|---|---|---|---|
| 1 | `thach_cot_so_sinh` | Thạch Cốt Sơ Sinh | `pham` | `ordinary` | `null` | `the_phach +1` | `DESIGN_BASELINE` |
| 2 | `man_luc_so_khai` | Man Lực Sơ Khai | `pham` | `ordinary` | `null` | `luc_dao +1` | `DESIGN_BASELINE` |
| 3 | `linh_tuc_so_sinh` | Linh Tức Sơ Sinh | `pham` | `ordinary` | `null` | `linh_tinh +1` | `DESIGN_BASELINE` |
| 4 | `khinh_than_so_hoc` | Khinh Thân Sơ Học | `pham` | `ordinary` | `null` | `than_phap +1` | `DESIGN_BASELINE` |
| 5 | `tinh_tam_ngung_than` | Tĩnh Tâm Ngưng Thần | `pham` | `ordinary` | `null` | `than_thuc +1` | `DESIGN_BASELINE` |
| 6 | `nhat_niem_khai_ngo` | Nhất Niệm Khai Ngộ | `pham` | `ordinary` | `null` | `ngo_tinh +1` | `DESIGN_BASELINE` |
| 7 | `kim_cang_can_cot` | Kim Cang Cân Cốt | `hoang` | `ordinary` | `null` | `the_phach +2` | `DESIGN_BASELINE` |
| 8 | `ho_tieu_chien_mach` | Hổ Tiếu Chiến Mạch | `hoang` | `ordinary` | `null` | `luc_dao +2` | `DESIGN_BASELINE` |
| 9 | `thanh_linh_chi_mach` | Thanh Linh Chi Mạch | `hoang` | `ordinary` | `null` | `linh_tinh +2` | `DESIGN_BASELINE` |
| 10 | `luu_anh_linh_bo` | Lưu Ảnh Linh Bộ | `hoang` | `ordinary` | `null` | `than_phap +2` | `DESIGN_BASELINE` |
| 11 | `thai_hu_than_niem` | Thái Hư Thần Niệm | `tien` | `ordinary` | `null` | `than_thuc +4` | `DESIGN_BASELINE` |
| 12 | `minh_khong_ngo_dao` | Minh Không Ngộ Đạo | `tien` | `ordinary` | `null` | `ngo_tinh +4` | `DESIGN_BASELINE` |
| 13 | `hon_nguyen_dao_cot` | Hỗn Nguyên Đạo Cốt | `tien` | `ordinary` | `null` | `the_phach +2, linh_tinh +2` | `DESIGN_BASELINE` |
| 14 | `luc_hop_linh_cot` | Lục Hợp Linh Cốt | `than` | `ordinary` | `null` | `the_phach +1, luc_dao +1, linh_tinh +1, than_phap +1, than_thuc +1, ngo_tinh +1` | `DESIGN_BASELINE` |
| 15 | `van_vi_dao_thai` | Vạn Vị Đạo Thai | `than` | `legendary_signature` | `phi_de` | `linh_tinh +4, ngo_tinh +4` | `APPROVED` |
| 16 | `huyen_anh_dao_thai` | Huyễn Ảnh Đạo Thai | `than` | `legendary_signature` | `dam_lon_tien_tu` | `than_phap +4, than_thuc +4` | `NOT_DESIGNED` |
