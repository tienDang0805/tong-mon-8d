import type Phaser from "phaser";
import { SPRITE_PROFILES } from "./SpriteProfiles.js";

export const PROP_KEYS = [
  "building_tan_thu_tu_duong",
  "building_tu_bao_cac",
  "building_hong_tran_cac",
  "prop_than_dinh",
  "prop_noodle_stall",
  "prop_portal_arch",
  "prop_bamboo_cluster",
  "prop_temple_pavilion",
  "prop_peach_tree",
  "prop_stone_lantern",
  "prop_spirit_herb",
  "prop_arched_bridge",
  "prop_bridge_horizontal",
  "prop_village_stele",
  "prop_incense_brazier",
  "prop_jade_rock",
  "prop_wooden_fence"
] as const;

export const TILESET_IMAGE_BINDINGS = [
  {
    key: "tan_thu_thon_v01b_tileset_32x32",
    url: "/assets/tilesets/tan_thu_thon_v01b_tileset_32x32.png"
  },
  {
    key: "bat_hoang_tileset",
    url: "/assets/tilesets/bat_hoang_tileset.png"
  }
] as const;

export const TILEMAP_JSON_BINDINGS = [
  {
    key: "tan_thu_thon",
    url: "/maps/tan_thu_thon.tmj"
  },
  {
    key: "thanh_truc_lam",
    url: "/maps/thanh_truc_lam.tmj"
  }
] as const;

export const VFX_SPRITESHEET_BINDINGS = [
  {
    key: "portal_ring",
    url: "/assets/vfx/portal_ring.png",
    frameWidth: 64,
    frameHeight: 64
  },
  {
    key: "phi_de_blessing",
    url: "/assets/vfx/phi_de_blessing.png",
    frameWidth: 64,
    frameHeight: 64
  },
  {
    key: "combat_vfx",
    url: "/assets/vfx/combat_vfx.png",
    frameWidth: 64,
    frameHeight: 64
  }
] as const;

export const V01B_UI_CHROME_URLS = {
  topLeftCrestFrame: "/assets/ui/hud_chrome/hud_top_left_crest_frame.png",
  minimapAstrolabeRing: "/assets/ui/hud_minimap_astrolabe_ring.png",
  skillbarLotusDock: "/assets/ui/hud_chrome/hud_skillbar_lotus_dock.png",
  barHpRuby: "/assets/ui/hud_chrome/bar_hp_ruby.png",
  barMpAzure: "/assets/ui/hud_chrome/bar_linh_luc_azure.png",
  barTuViCyanGold: "/assets/ui/hud_chrome/bar_tu_vi_cyan_gold.png",
  barExpSilverGold: "/assets/ui/hud_chrome/bar_exp_silver_gold.png",
  orbDantianStarCore: "/assets/ui/hud_chrome/orb_dantian_star_core.png",
  currencyLinhThach32: "/assets/ui/icons_32x32/currency_linh_thach_32.png",
  currencyLinhThach64: "/assets/ui/icons_64x64/currency_linh_thach_64.png",
  orbTuViCore32: "/assets/ui/icons_32x32/orb_tu_vi_core_32.png",
  orbTuViCore64: "/assets/ui/icons_64x64/orb_tu_vi_core_64.png",
  questMarkerAvailable: "/assets/ui/quest_and_prompts/quest_marker_available_excl.png",
  questMarkerActive: "/assets/ui/quest_and_prompts/quest_marker_active_question.png",
  questMarkerTurnin: "/assets/ui/quest_and_prompts/quest_marker_turnin_seal.png",
  interactPillGold: "/assets/ui/quest_and_prompts/interact_prompt_pill_gold_jade.png",
  interactPillAzure: "/assets/ui/quest_and_prompts/interact_prompt_pill_azure_jade.png",
  ccLotusPedestal: "/assets/ui/character_creation_and_c_panel/cc_pedestal_lotus_dais.png",
  ccNameScrollInput: "/assets/ui/character_creation_and_c_panel/cc_name_scroll_input_frame.png",
  ccAppearanceCardSelected: "/assets/ui/character_creation_and_c_panel/cc_appearance_card_selected.png",
  ccAppearanceCardUnselected: "/assets/ui/character_creation_and_c_panel/cc_appearance_card_unselected.png",
  socketTienThienLocked: "/assets/ui/character_creation_and_c_panel/socket_destiny_tien_thien_locked.png",
  socketHauThienActive: "/assets/ui/character_creation_and_c_panel/socket_destiny_hau_thien_active.png",
  socketHauThienEquippable: "/assets/ui/character_creation_and_c_panel/socket_destiny_hau_thien_equippable.png",
  sealDaoGoldLotus: "/assets/ui/buttons_and_tabs/seal_dao_gold_lotus.png",
  sealDaoCinnabar: "/assets/ui/buttons_and_tabs/seal_dao_cinnabar.png",
  entryTitleTerraceBackdrop: "/assets/ui/entry/bg_title_and_creation_terrace_v01b.png",
  entryDestinyAstrolabeBackdrop: "/assets/ui/entry/bg_destiny_astrolabe_chamber_v01b.png",
  panelHeaderBannerCrest: "/assets/ui/presentation/header_banner_crest_v01b.png",
  cultivationMeditationStarWheel: "/assets/ui/presentation/cultivation_meditation_star_wheel_v01b.png",
  cultivationMeridianHexagramPlate: "/assets/ui/presentation/cultivation_meridian_hexagram_plate_v01b.png",
  inventoryPaperdollLotusStage: "/assets/ui/presentation/inventory_paperdoll_lotus_stage_v01b.png",
  frameCelestialJadeGold: "/assets/ui/frames_9slice/panel_tier2_celestial_navy_jade_9slice.png",
  frameGroundedWoodJade: "/assets/ui/frames_9slice/panel_tier1_grounded_wood_jade_9slice.png",
  frameIvoryScroll: "/assets/ui/frames_9slice/panel_tier2_celestial_ivory_scroll_9slice.png",
  frameQuestTrackerScroll: "/assets/ui/frames_9slice/panel_quest_tracker_scroll_9slice.png",
  buttonJadeDefault: "/assets/ui/buttons_and_tabs/btn_jade_gold_default.png",
  buttonJadeHover: "/assets/ui/buttons_and_tabs/btn_jade_gold_hover.png",
  buttonJadePressed: "/assets/ui/buttons_and_tabs/btn_jade_gold_pressed.png",
  buttonJadeDisabled: "/assets/ui/buttons_and_tabs/btn_jade_gold_disabled.png",
  buttonCinnabarDefault: "/assets/ui/buttons_and_tabs/btn_cinnabar_default.png",
  buttonCinnabarHover: "/assets/ui/buttons_and_tabs/btn_cinnabar_hover.png",
  buttonCinnabarPressed: "/assets/ui/buttons_and_tabs/btn_cinnabar_pressed.png",
  buttonCinnabarDisabled: "/assets/ui/buttons_and_tabs/btn_cinnabar_disabled.png",
  buttonPlusReady: "/assets/ui/buttons_and_tabs/btn_plus_alloc_ready.png",
  buttonPlusDisabled: "/assets/ui/buttons_and_tabs/btn_plus_alloc_disabled.png",
  tabClaspActive: "/assets/ui/buttons_and_tabs/tab_header_active_gold_jade.png",
  tabClaspHover: "/assets/ui/buttons_and_tabs/tab_header_hover_azure_jade.png",
  tabClaspInactive: "/assets/ui/buttons_and_tabs/tab_header_inactive_wood_jade.png"
} as const;

export function resolveStarterPortraitUrl(
  appearanceId?: string | null,
  fallbackUrl?: string
): string {
  if (
    appearanceId === "hero_kiem_tu" ||
    appearanceId === "hoa_tran" ||
    appearanceId === "ngoc_tam" ||
    appearanceId === "anh_7"
  ) {
    return `/assets/portraits/portrait_${appearanceId}.png`;
  }
  return fallbackUrl || "/assets/portraits/portrait_hero_kiem_tu.png";
}

export function resolveNpcPortraitUrl(npcId?: string | null): string {
  const validPortraits = new Set([
    "phi_de",
    "rmt_de",
    "vaal_de",
    "chatdvt",
    "dam_lon_tien_tu",
    "ngoc_tam",
    "thai_tai",
    "anh_7",
    "gia_bao",
    "hoa_tran",
    "merchant_truong",
    "hero_kiem_tu"
  ]);
  if (npcId && validPortraits.has(npcId)) {
    return `/assets/portraits/portrait_${npcId}.png`;
  }
  return "/assets/portraits/portrait_phi_de.png";
}

export function resolveAttributeIconUrl(
  attrKey: string,
  size: 32 | 64 = 32
): string {
  const dir = size === 64 ? "icons_64x64" : "icons_32x32";
  const validKeys = new Set([
    "the_phach",
    "luc_dao",
    "linh_tinh",
    "than_phap",
    "than_thuc",
    "ngo_tinh"
  ]);
  const safeKey = validKeys.has(attrKey) ? attrKey : "the_phach";
  return `/assets/ui/${dir}/attr_${safeKey}_${size}.png`;
}

export function resolveDestinyTraitIconUrl(
  traitId: string,
  size: 32 | 64 = 64
): string {
  const dir = size === 64 ? "icons_64x64" : "icons_32x32";
  const dedicatedMap: Record<string, string> = {
    van_vi_dao_thai: `destiny_van_vi_dao_thai_${size}.png`,
    thai_hu_than_niem: `destiny_thai_hu_than_niem_${size}.png`,
    minh_khong_ngo_dao: `destiny_minh_khong_ngo_dao_${size}.png`,
    kim_cang_can_cot: `destiny_kim_cang_can_cot_${size}.png`,
    thach_cot_so_sinh: `destiny_thach_cot_so_sinh_${size}.png`,
    man_luc_so_khai: `attr_luc_dao_${size}.png`,
    ho_tieu_chien_mach: `attr_luc_dao_${size}.png`,
    linh_tuc_so_sinh: `attr_linh_tinh_${size}.png`,
    thanh_linh_chi_mach: `attr_linh_tinh_${size}.png`,
    khinh_than_so_hoc: `attr_than_phap_${size}.png`,
    luu_anh_linh_bo: `attr_than_phap_${size}.png`,
    tinh_tam_ngung_than: `attr_than_thuc_${size}.png`,
    nhat_niem_khai_ngo: `attr_ngo_tinh_${size}.png`,
    hon_nguyen_dao_cot: `attr_the_phach_${size}.png`,
    luc_hop_linh_cot: `orb_tu_vi_core_${size}.png`,
    huyen_anh_dao_thai: `destiny_thai_hu_than_niem_${size}.png`
  };
  const file = dedicatedMap[traitId] ?? `orb_tu_vi_core_${size}.png`;
  return `/assets/ui/${dir}/${file}`;
}

export function resolveDestinyCardFrameUrl(rarity: string): string {
  const valid = new Set(["pham", "hoang", "tien", "than"]);
  const safeRarity = valid.has(rarity) ? rarity : "pham";
  return `/assets/ui/character_creation_and_c_panel/destiny_card_${safeRarity}.png`;
}

export function resolveItemIconUrl(
  itemId: string,
  size: 32 | 64 = 64
): string {
  const dir = size === 64 ? "icons_64x64" : "icons_32x32";
  const validItems = new Set([
    "mi_linh_thach_thanh_truc",
    "banh_bao_linh_thu",
    "canh_truc_lang_linh_thao",
    "tra_thanh_tam_tinh_khi",
    "tu_khi_dan_so_cap",
    "bot_linh_mach",
    "thanh_tam_thao",
    "thit_truc_lang",
    "nanh_truc_lang",
    "vay_thanh_lan",
    "thanh_van_kiem_so_cap"
  ]);
  if (validItems.has(itemId)) {
    return `/assets/ui/${dir}/item_${itemId}_${size}.png`;
  }
  return `/assets/ui/${dir}/currency_linh_thach_${size}.png`;
}

export function resolveItemSlotFrameUrl(itemId: string): string {
  if (itemId === "canh_truc_lang_linh_thao") {
    return "/assets/ui/slots_and_rarity_frames/slot_item_hoang_64.png";
  }
  if (
    itemId === "banh_bao_linh_thu" ||
    itemId === "tu_khi_dan_so_cap" ||
    itemId === "thanh_van_kiem_so_cap" ||
    itemId === "vay_thanh_lan"
  ) {
    return "/assets/ui/slots_and_rarity_frames/slot_item_linh_64.png";
  }
  return "/assets/ui/slots_and_rarity_frames/slot_item_pham_64.png";
}

export function resolveEquipmentSlotIconUrl(
  slotKey: string,
  size: 32 | 64 = 64
): string {
  const dir = size === 64 ? "icons_64x64" : "icons_32x32";
  const validSlots = new Set([
    "phap_bao",
    "mao_quan",
    "binh_khi",
    "dao_bao",
    "ho_uyen",
    "yeu_dai",
    "chien_hai",
    "ngoc_boi"
  ]);
  const safeKey = validSlots.has(slotKey) ? slotKey : "phap_bao";
  return `/assets/ui/${dir}/equip_slot_${safeKey}_${size}.png`;
}

export function preloadWorldSceneAssets(loader: Phaser.Loader.LoaderPlugin): void {
  for (const ts of TILESET_IMAGE_BINDINGS) {
    loader.image(ts.key, ts.url);
  }
  for (const tm of TILEMAP_JSON_BINDINGS) {
    loader.tilemapTiledJSON(tm.key, tm.url);
  }
  for (const def of Object.values(SPRITE_PROFILES)) {
    loader.spritesheet(def.spriteKey, `/assets/sprites/${def.spriteKey}.png?v=20261019_v5`, {
      frameWidth: def.frameWidth,
      frameHeight: def.frameHeight
    });
  }
  for (const pk of PROP_KEYS) {
    loader.image(pk, `/assets/props/${pk}.png`);
  }
  for (const vfx of VFX_SPRITESHEET_BINDINGS) {
    loader.spritesheet(vfx.key, vfx.url, {
      frameWidth: vfx.frameWidth,
      frameHeight: vfx.frameHeight
    });
  }
}
