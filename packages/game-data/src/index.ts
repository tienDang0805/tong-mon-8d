import type {
  BaseAttributeKey,
  BaseAttributes,
  BuffSlotCategory,
  CanonicalRealmId,
  CharacterLevelProgress,
  CombatDisciplineId,
  DestinyCollection,
  DestinyDefinitionMetadata,
  DestinyRarity,
  Direction,
  FoodQualityTier,
  NpcRealmId,
  ZoneId
} from "@tong-mon-8d/shared";

export interface RealmDefinition {
  id: CanonicalRealmId;
  orderIndex: number;
  nameVi: string;
  stageCount: number;
  subStageLabels: string[];
  baseTuViPerStage: number;
  stageTuViMultiplier: number;
  hpBonusPerStage: number;
  mpBonusPerStage: number;
  attackBonusPerStage: number;
  defenseBonusPerStage: number;
  baseMeditationRatePerSec: number;
  breakthroughItemId: string | null;
  breakthroughItemCount: number;
  auraColorHex: number;
  unlockSummaryVi: string;
  playableInVerticalSlice: boolean;
}

export const REALM_PROGRESSION: RealmDefinition[] = [
  {
    id: "pham_nhan",
    orderIndex: 0,
    nameVi: "Phàm Nhân",
    stageCount: 1,
    subStageLabels: ["Phàm Thể"],
    baseTuViPerStage: 120,
    stageTuViMultiplier: 1,
    hpBonusPerStage: 0,
    mpBonusPerStage: 0,
    attackBonusPerStage: 0,
    defenseBonusPerStage: 0,
    baseMeditationRatePerSec: 0.15,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0xa8b5c2,
    unlockSummaryVi: "Cảm ứng thiên địa linh khí, mở đầu con đường tu tiên.",
    playableInVerticalSlice: true
  },
  {
    id: "luyen_khi",
    orderIndex: 1,
    nameVi: "Luyện Khí",
    stageCount: 9,
    subStageLabels: [
      "Tầng 1",
      "Tầng 2",
      "Tầng 3",
      "Tầng 4",
      "Tầng 5",
      "Tầng 6",
      "Tầng 7",
      "Tầng 8",
      "Tầng 9"
    ],
    baseTuViPerStage: 180,
    stageTuViMultiplier: 1.32,
    hpBonusPerStage: 35,
    mpBonusPerStage: 20,
    attackBonusPerStage: 6,
    defenseBonusPerStage: 4,
    baseMeditationRatePerSec: 0.28,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0x4dabf7,
    unlockSummaryVi: "Khai thông kinh mạch, thi triển Kiếm Khí Ưng và thu thập Linh Thạch.",
    playableInVerticalSlice: true
  },
  {
    id: "truc_co",
    orderIndex: 2,
    nameVi: "Trúc Cơ",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Đỉnh Phong"],
    baseTuViPerStage: 1600,
    stageTuViMultiplier: 1.45,
    hpBonusPerStage: 140,
    mpBonusPerStage: 80,
    attackBonusPerStage: 18,
    defenseBonusPerStage: 12,
    baseMeditationRatePerSec: 0.65,
    breakthroughItemId: "tu_khi_dan_so_cap",
    breakthroughItemCount: 1,
    auraColorHex: 0x38d9a9,
    unlockSummaryVi: "Đúc đạo cơ vững chắc, mở khóa bí cảnh sơ cấp.",
    playableInVerticalSlice: true
  },
  {
    id: "kim_dan",
    orderIndex: 3,
    nameVi: "Kim Đan",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Đỉnh Phong"],
    baseTuViPerStage: 6500,
    stageTuViMultiplier: 1.5,
    hpBonusPerStage: 320,
    mpBonusPerStage: 160,
    attackBonusPerStage: 42,
    defenseBonusPerStage: 28,
    baseMeditationRatePerSec: 1.4,
    breakthroughItemId: "tu_khi_dan_so_cap",
    breakthroughItemCount: 3,
    auraColorHex: 0xffd43b,
    unlockSummaryVi: "Ngưng tụ Kim Đan bất hoại, ngự kiếm phi hành.",
    playableInVerticalSlice: false
  },
  {
    id: "nguyen_anh",
    orderIndex: 4,
    nameVi: "Nguyên Anh",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Đỉnh Phong"],
    baseTuViPerStage: 24000,
    stageTuViMultiplier: 1.55,
    hpBonusPerStage: 700,
    mpBonusPerStage: 350,
    attackBonusPerStage: 85,
    defenseBonusPerStage: 55,
    baseMeditationRatePerSec: 3.0,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0xda77f2,
    unlockSummaryVi: "Phá đan thành anh, thần thức bao phủ vạn dặm.",
    playableInVerticalSlice: false
  },
  {
    id: "hoa_than",
    orderIndex: 5,
    nameVi: "Hóa Thần",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Đỉnh Phong"],
    baseTuViPerStage: 85000,
    stageTuViMultiplier: 1.6,
    hpBonusPerStage: 1400,
    mpBonusPerStage: 700,
    attackBonusPerStage: 160,
    defenseBonusPerStage: 110,
    baseMeditationRatePerSec: 6.5,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0xf783ac,
    unlockSummaryVi: "Nguyên thần xuất khiếu, cảm ngộ thiên địa pháp tắc.",
    playableInVerticalSlice: false
  },
  {
    id: "luyen_hu",
    orderIndex: 6,
    nameVi: "Luyện Hư",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Đỉnh Phong"],
    baseTuViPerStage: 260000,
    stageTuViMultiplier: 1.6,
    hpBonusPerStage: 2600,
    mpBonusPerStage: 1200,
    attackBonusPerStage: 300,
    defenseBonusPerStage: 200,
    baseMeditationRatePerSec: 12.0,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0x748ffc,
    unlockSummaryVi: "Hòa nhập hư không, nắm giữ không gian chi lực.",
    playableInVerticalSlice: false
  },
  {
    id: "hop_the",
    orderIndex: 7,
    nameVi: "Hợp Thể",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Đỉnh Phong"],
    baseTuViPerStage: 780000,
    stageTuViMultiplier: 1.65,
    hpBonusPerStage: 4800,
    mpBonusPerStage: 2200,
    attackBonusPerStage: 540,
    defenseBonusPerStage: 360,
    baseMeditationRatePerSec: 25.0,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0x63e6be,
    unlockSummaryVi: "Thân dữ đạo hợp, pháp tướng thiên địa.",
    playableInVerticalSlice: false
  },
  {
    id: "do_kiep",
    orderIndex: 8,
    nameVi: "Độ Kiếp",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Đỉnh Phong"],
    baseTuViPerStage: 2200000,
    stageTuViMultiplier: 1.7,
    hpBonusPerStage: 8500,
    mpBonusPerStage: 4000,
    attackBonusPerStage: 950,
    defenseBonusPerStage: 640,
    baseMeditationRatePerSec: 50.0,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0xff8787,
    unlockSummaryVi: "Nghênh đón cửu trọng lôi kiếp, thoát phàm nhập tiên.",
    playableInVerticalSlice: false
  },
  {
    id: "ban_tien",
    orderIndex: 9,
    nameVi: "Bán Tiên",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Đỉnh Phong"],
    baseTuViPerStage: 6000000,
    stageTuViMultiplier: 1.75,
    hpBonusPerStage: 15000,
    mpBonusPerStage: 7000,
    attackBonusPerStage: 1650,
    defenseBonusPerStage: 1100,
    baseMeditationRatePerSec: 95.0,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0xffe066,
    unlockSummaryVi: "Chuyển hóa bán tiên chi thể, tiếp xúc tiên nguyên.",
    playableInVerticalSlice: false
  },
  {
    id: "chan_tien",
    orderIndex: 10,
    nameVi: "Chân Tiên",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Đỉnh Phong"],
    baseTuViPerStage: 16000000,
    stageTuViMultiplier: 1.8,
    hpBonusPerStage: 26000,
    mpBonusPerStage: 12000,
    attackBonusPerStage: 2800,
    defenseBonusPerStage: 1900,
    baseMeditationRatePerSec: 180.0,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0x99e9f2,
    unlockSummaryVi: "Chứng đạo Chân Tiên, trường sinh bất lão.",
    playableInVerticalSlice: false
  },
  {
    id: "thai_at_kim_tien",
    orderIndex: 11,
    nameVi: "Thái Ất Kim Tiên",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Đỉnh Phong"],
    baseTuViPerStage: 42000000,
    stageTuViMultiplier: 1.85,
    hpBonusPerStage: 45000,
    mpBonusPerStage: 21000,
    attackBonusPerStage: 4600,
    defenseBonusPerStage: 3100,
    baseMeditationRatePerSec: 340.0,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0x8ce99a,
    unlockSummaryVi: "Ngưng tụ Thái Ất Đạo Quả, tiêu dao tiên giới.",
    playableInVerticalSlice: false
  },
  {
    id: "dai_la_kim_tien",
    orderIndex: 12,
    nameVi: "Đại La Kim Tiên",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Đỉnh Phong"],
    baseTuViPerStage: 110000000,
    stageTuViMultiplier: 1.9,
    hpBonusPerStage: 78000,
    mpBonusPerStage: 36000,
    attackBonusPerStage: 7600,
    defenseBonusPerStage: 5100,
    baseMeditationRatePerSec: 650.0,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0xfff3bf,
    unlockSummaryVi: "Siêu thoát dòng sông thời gian, bất diệt tại Tiên Vực.",
    playableInVerticalSlice: false
  },
  {
    id: "tram_nhat_dao",
    orderIndex: 13,
    nameVi: "Trảm Nhất Đao",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Đỉnh Phong"],
    baseTuViPerStage: 280000000,
    stageTuViMultiplier: 1.95,
    hpBonusPerStage: 130000,
    mpBonusPerStage: 60000,
    attackBonusPerStage: 12500,
    defenseBonusPerStage: 8400,
    baseMeditationRatePerSec: 1200.0,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0xffa8a8,
    unlockSummaryVi: "Trảm khứ chấp niệm quá khứ, bước vào cổ lộ Trảm Đạo.",
    playableInVerticalSlice: false
  },
  {
    id: "tram_nhi_dao",
    orderIndex: 14,
    nameVi: "Trảm Nhị Đao",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Đỉnh Phong"],
    baseTuViPerStage: 720000000,
    stageTuViMultiplier: 2.0,
    hpBonusPerStage: 210000,
    mpBonusPerStage: 95000,
    attackBonusPerStage: 20000,
    defenseBonusPerStage: 13500,
    baseMeditationRatePerSec: 2200.0,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0xff6b6b,
    unlockSummaryVi: "Trảm bản ngã hiện tại, đạo tâm kiên định tuyệt đối.",
    playableInVerticalSlice: false
  },
  {
    id: "tram_tam_dao",
    orderIndex: 15,
    nameVi: "Trảm Tam Đao",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Đỉnh Phong"],
    baseTuViPerStage: 1800000000,
    stageTuViMultiplier: 2.05,
    hpBonusPerStage: 340000,
    mpBonusPerStage: 150000,
    attackBonusPerStage: 32000,
    defenseBonusPerStage: 21500,
    baseMeditationRatePerSec: 4000.0,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0xe03131,
    unlockSummaryVi: "Tam đao trảm tận thiên mệnh, chạm ngưỡng Bán Thánh.",
    playableInVerticalSlice: false
  },
  {
    id: "ban_thanh",
    orderIndex: 16,
    nameVi: "Bán Thánh",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Đỉnh Phong"],
    baseTuViPerStage: 4500000000,
    stageTuViMultiplier: 2.1,
    hpBonusPerStage: 550000,
    mpBonusPerStage: 240000,
    attackBonusPerStage: 52000,
    defenseBonusPerStage: 35000,
    baseMeditationRatePerSec: 7500.0,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0xcc5de8,
    unlockSummaryVi: "Ngưng tụ bán bộ Thánh Uy, hiệu lệnh một phương đại vực.",
    playableInVerticalSlice: false
  },
  {
    id: "thanh_canh",
    orderIndex: 17,
    nameVi: "Thánh Cảnh",
    stageCount: 4,
    subStageLabels: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Chí Tôn Đỉnh Phong"],
    baseTuViPerStage: 12000000000,
    stageTuViMultiplier: 2.2,
    hpBonusPerStage: 900000,
    mpBonusPerStage: 400000,
    attackBonusPerStage: 85000,
    defenseBonusPerStage: 58000,
    baseMeditationRatePerSec: 15000.0,
    breakthroughItemId: null,
    breakthroughItemCount: 0,
    auraColorHex: 0xffc024,
    unlockSummaryVi: "Vạn Cổ Thánh Cảnh bất diệt, sánh vai cùng Tam Đế Huyền Thoại.",
    playableInVerticalSlice: false
  }
];

export interface LegendaryNpcDefinition {
  id: string;
  nameVi: string;
  titleVi: string;
  realmId: NpcRealmId;
  realmDisplayVi: string;
  daoNameVi: string;
  isLegendaryTen: boolean;
  isTamDe: boolean;
  spriteKey: string;
  portraitKey: string;
  zoneId: ZoneId;
  spawnX: number;
  spawnY: number;
  greetingLinesVi: string[];
  questlineTitleVi: string;
  inheritanceSkillNameVi: string;
}

export const LEGENDARY_NPCS: LegendaryNpcDefinition[] = [
  {
    id: "phi_de",
    nameVi: "Phì Đế — Đặng Văn Tiến",
    titleVi: "Ẩm Thực Đại Đạo Chí Tôn • Khai Sơn Tổ Sư 8D",
    realmId: "thanh_canh",
    realmDisplayVi: "Thánh Cảnh",
    daoNameVi: "Ẩm Thực Đại Đạo",
    isLegendaryTen: true,
    isTamDe: true,
    spriteKey: "phi_de",
    portraitKey: "portrait_phi_de",
    zoneId: "tan_thu_thon",
    spawnX: 536,
    spawnY: 368,
    greetingLinesVi: [
      "Hương vị nhân gian chính là linh cơ chân thật nhất của Đại Đạo.",
      "Đừng tưởng bổn tọa chỉ ngồi thưởng mì nơi Tân Thủ Thôn mà xem nhẹ Ẩm Thực Đại Đạo!",
      "Dù ngươi tự tay nấu nướng hay bỏ Linh Thạch mua lấy một bát mì ngon của Lão Trù Trương, chỉ cần có tấm lòng kính trọng mỹ vị, bổn tọa đều ban cơ duyên!"
    ],
    questlineTitleVi: "Vạn Vị Thành Đạo: Một Bữa Ăn Định Tiên Duyên",
    inheritanceSkillNameVi: "Phì Thiên Thực Đạo Kinh"
  },
  {
    id: "rmt_de",
    nameVi: "RMT Đế — Phạm Phan Trọng Khải",
    titleVi: "Kim Tiền Đại Đạo Chí Tôn",
    realmId: "thanh_canh",
    realmDisplayVi: "Thánh Cảnh",
    daoNameVi: "Kim Tiền Đại Đạo",
    isLegendaryTen: true,
    isTamDe: true,
    spriteKey: "rmt_de",
    portraitKey: "portrait_rmt_de",
    zoneId: "tan_thu_thon",
    spawnX: 816,
    spawnY: 296,
    greetingLinesVi: [
      "Dùng Linh Thạch mua Tiên Lộ không phải là lười biếng, mà là hiểu rõ quy luật vận chuyển của vạn vật!",
      "Nhớ kỹ: ở Bát Hoang này chỉ dùng Linh Thạch kiếm được trong thiên địa, tuyệt đối không có chuyện nạp tiền giả tạo!"
    ],
    questlineTitleVi: "Kim Tiền Thông Thiên: Dùng Tiền Mua Tiên Lộ",
    inheritanceSkillNameVi: "Vạn Kim Thông Thiên Kinh"
  },
  {
    id: "vaal_de",
    nameVi: "Vaal Đế — Trần Vũ Hoàng Tâm",
    titleVi: "Vận Mệnh Tất Tay Đại Đạo Chí Tôn",
    realmId: "thanh_canh",
    realmDisplayVi: "Thánh Cảnh",
    daoNameVi: "Vận Mệnh / Tất Tay Đại Đạo",
    isLegendaryTen: true,
    isTamDe: true,
    spriteKey: "vaal_de",
    portraitKey: "portrait_vaal_de",
    zoneId: "thanh_truc_lam",
    spawnX: 960,
    spawnY: 288,
    greetingLinesVi: [
      "1 ăn cả 2 ăn lồn! Thiên mệnh trước mặt, kẻ dám đặt cược với đạo tâm mới hiểu thế nào là nghịch thiên!",
      "Tất nhiên mọi xác suất biến dị của bổn tọa đều minh bạch, ngươi luôn có quyền chọn đường an toàn!"
    ],
    questlineTitleVi: "Nhất Niệm Tất Tay: Nghịch Thiên Cải Mệnh",
    inheritanceSkillNameVi: "Vạn Kiếp Vaal Thiên Kinh"
  },
  {
    id: "chatdvt",
    nameVi: "ChatDVT",
    titleVi: "Hộ Pháp Linh Thú • Vạn Linh Khế Ước",
    realmId: "thanh_canh",
    realmDisplayVi: "Thánh Cảnh (Thánh Thú)",
    daoNameVi: "Vạn Linh Khế Ước Đại Đạo",
    isLegendaryTen: true,
    isTamDe: false,
    spriteKey: "chatdvt",
    portraitKey: "portrait_chatdvt",
    zoneId: "tan_thu_thon",
    spawnX: 668,
    spawnY: 404,
    greetingLinesVi: [
      "Gâu... à nhầm, bổn Thánh Thú là ChatDVT của Phì Đế đại nhân, không phải con chó cảnh đâu nhé!",
      "Nhìn tu vi của ngươi kìa, chưa đánh nổi con Trúc Lang mà đã tính chuyện phi thăng à? Mau kiếm bát Mì Linh Mạch dâng lên Phì Đế đi!"
    ],
    questlineTitleVi: "Thánh Thú Vấn Tâm: Vạn Linh Quy Tông",
    inheritanceSkillNameVi: "Vạn Linh Thánh Khế"
  },
  {
    id: "dam_lon_tien_tu",
    nameVi: "Dẩm Lồn Tiên Tử",
    titleVi: "Hồng Trần Tâm Đạo Tiên Tử • Đạo Lữ của Phì Đế",
    realmId: "UNKNOWN",
    realmDisplayVi: "Bất Minh (Không Rõ Cảnh Giới)",
    daoNameVi: "Hồng Trần Tâm Đạo",
    isLegendaryTen: true,
    isTamDe: false,
    spriteKey: "dam_lon_tien_tu",
    portraitKey: "portrait_dam_lon_tien_tu",
    zoneId: "tan_thu_thon",
    spawnX: 256,
    spawnY: 336,
    greetingLinesVi: [
      "Hồng trần vạn kiếp, giữ được một niệm chân tâm mới là điều khó nhất.",
      "Đặng Văn Tiến suốt ngày chỉ nhớ chuyện đại yến, nhưng cũng nhờ cái bụng chân thành ấy mà thiếp đồng hành cùng chàng qua bao kỷ nguyên."
    ],
    questlineTitleVi: "Hồng Trần Vạn Kiếp: Nhất Niệm Chân Tâm",
    inheritanceSkillNameVi: "Hồng Trần Tâm Kinh"
  },
  {
    id: "ngoc_tam",
    nameVi: "Xui Xẻo Chân Quân — Ngọc Tâm",
    titleVi: "Nhân Quả Nghịch Hành Bán Thánh",
    realmId: "ban_thanh",
    realmDisplayVi: "Bán Thánh",
    daoNameVi: "Nhân Quả Xui Xẻo Đạo",
    isLegendaryTen: true,
    isTamDe: false,
    spriteKey: "ngoc_tam",
    portraitKey: "portrait_ngoc_tam",
    zoneId: "tan_thu_thon",
    spawnX: 256,
    spawnY: 640,
    greetingLinesVi: [
      "Đứng cách ta ba trượng ra... Hôm nay ta vừa bước chân ra cửa đã bị chim linh thú ỉa trúng đầu.",
      "Đừng nhầm ta với lão Vaal Đế Trần Vũ Hoàng Tâm kia, vận xui của ta là nhân quả định lượng!"
    ],
    questlineTitleVi: "Vạn Kiếp Xui Xẻo: Nhân Quả Nghịch Hành",
    inheritanceSkillNameVi: "Đại Xui Xẻo Thuật"
  },
  {
    id: "thai_tai",
    nameVi: "Thái Tài",
    titleVi: "Thiên Nhãn Giám Bảo Bán Thánh",
    realmId: "ban_thanh",
    realmDisplayVi: "Bán Thánh",
    daoNameVi: "Giám Bảo Cổ Khí Đạo",
    isLegendaryTen: true,
    isTamDe: false,
    spriteKey: "hoa_tran",
    portraitKey: "portrait_hoa_tran",
    zoneId: "tan_thu_thon",
    spawnX: 832,
    spawnY: 608,
    greetingLinesVi: [
      "RMT Đế chỉ nhìn giá cả, còn lão phu nhìn thấu linh hồn và lịch sử ẩn trong từng món cổ bảo."
    ],
    questlineTitleVi: "Thiên Hạ Vạn Bảo: Chân Giả Khó Phân",
    inheritanceSkillNameVi: "Thiên Nhãn Giám Bảo"
  },
  {
    id: "anh_7",
    nameVi: "Anh 7 — Đoàn Quang Huy",
    titleVi: "Thất Kiếm Phá Thiên Bán Thánh",
    realmId: "ban_thanh",
    realmDisplayVi: "Bán Thánh",
    daoNameVi: "Thất Kiếm Đại Đạo",
    isLegendaryTen: true,
    isTamDe: false,
    spriteKey: "anh_7",
    portraitKey: "portrait_anh_7",
    zoneId: "thanh_truc_lam",
    spawnX: 480,
    spawnY: 256,
    greetingLinesVi: [
      "Bảy thanh kiếm của ta chỉ xuất vỏ khi gặp kẻ có kiếm tâm kiên định."
    ],
    questlineTitleVi: "Thất Kiếm Phá Thiên: Một Kiếm Định Càn Khôn",
    inheritanceSkillNameVi: "Thất Kiếm Liên Hoàn"
  },
  {
    id: "gia_bao",
    nameVi: "Gia Bảo",
    titleVi: "Đại La Vô Cực Tiên Nhân",
    realmId: "dai_la_kim_tien",
    realmDisplayVi: "Đại La Kim Tiên",
    daoNameVi: "Đại La Vô Cực Đạo",
    isLegendaryTen: true,
    isTamDe: false,
    spriteKey: "hero_kiem_tu",
    portraitKey: "portrait_hero_kiem_tu",
    zoneId: "thanh_truc_lam",
    spawnX: 1120,
    spawnY: 688,
    greetingLinesVi: [
      "Ta dừng ở đỉnh phong Đại La Kim Tiên đã lâu, chỉ đợi tìm ra minh văn Trảm Nhất Đao."
    ],
    questlineTitleVi: "Đại La Vô Cực: Trảm Đạo Cầu Sinh",
    inheritanceSkillNameVi: "Đại La Tiên Ấn"
  },
  {
    id: "hoa_tran",
    nameVi: "Hòa Trần",
    titleVi: "Thanh Phong Tiêu Dao • Thái Ất Kim Tiên",
    realmId: "thai_at_kim_tien",
    realmDisplayVi: "Thái Ất Kim Tiên",
    daoNameVi: "Thanh Phong Vô Danh Đạo",
    isLegendaryTen: true,
    isTamDe: false,
    spriteKey: "hoa_tran",
    portraitKey: "portrait_hoa_tran",
    zoneId: "thanh_truc_lam",
    spawnX: 288,
    spawnY: 432,
    greetingLinesVi: [
      "Gió thổi qua rừng trúc không lưu lại dấu vết. Đạo hữu từ Tân Thủ Thôn bước qua Truyền Tống Trận tới đây, có cảm nhận được linh khí khác biệt chăng?",
      "Trong Thanh Trúc Lâm có Trúc Lang và Thanh Lân Xà canh giữ Thanh Tâm Thảo. Hãy cẩn thận bước chân."
    ],
    questlineTitleVi: "Thanh Phong Tiêu Dao: Đại Đạo Vô Danh",
    inheritanceSkillNameVi: "Thanh Phong Bộ"
  },
  {
    id: "merchant_truong",
    nameVi: "Lão Trù Trương",
    titleVi: "Chưởng Quầy Quán Mì Linh Thiện",
    realmId: "truc_co",
    realmDisplayVi: "Trúc Cơ Hậu Kỳ",
    daoNameVi: "Linh Trù Thế Gia",
    isLegendaryTen: false,
    isTamDe: false,
    spriteKey: "merchant_truong",
    portraitKey: "portrait_merchant_truong",
    zoneId: "tan_thu_thon",
    spawnX: 384,
    spawnY: 392,
    greetingLinesVi: [
      "Mì Linh Mạch nóng hổi, Bánh Bao Linh Thú thơm lừng đây! Mua ăn liền cũng đắc đạo, mà mua nguyên liệu về tự nấu bên Thần Đỉnh cũng thành tài!",
      "Vị tiền bối mặc hắc kim bào ngồi cạnh quán lão phu chính là Phì Đế đại nhân đấy, mau dâng một món ngon để cầu cơ duyên!"
    ],
    questlineTitleVi: "Ẩm Thực Nhập Môn",
    inheritanceSkillNameVi: "Không"
  }
];

export interface ItemDefinition {
  id: string;
  nameVi: string;
  category: "food" | "beverage" | "pill" | "ingredient" | "material" | "equipment";
  descriptionVi: string;
  buyPriceLinhThach: number | null;
  sellPriceLinhThach: number;
  maxStack: number;
  qualifiesForPhiDeQuest: boolean;
  buffSlot?: BuffSlotCategory;
  buffDurationSec?: number;
  attackBonus?: number;
  defenseBonus?: number;
  hpRestore?: number;
  tuViGrant?: number;
  tuViMultiplier?: number;
}

export const ITEMS_REGISTRY: Record<string, ItemDefinition> = {
  mi_linh_thach_thanh_truc: {
    id: "mi_linh_thach_thanh_truc",
    nameVi: "Mì Linh Mạch Thanh Trúc",
    category: "food",
    descriptionVi: "Sợi mì nhào từ Bột Linh Mạch nấu cùng măng trúc non, hương thơm ngào ngạt đạt chuẩn dâng lên Phì Đế.",
    buyPriceLinhThach: 25,
    sellPriceLinhThach: 12,
    maxStack: 50,
    qualifiesForPhiDeQuest: true,
    buffSlot: "meal",
    buffDurationSec: 600,
    attackBonus: 8,
    defenseBonus: 4,
    hpRestore: 60,
    tuViMultiplier: 1.25
  },
  banh_bao_linh_thu: {
    id: "banh_bao_linh_thu",
    nameVi: "Bánh Bao Linh Thú",
    category: "food",
    descriptionVi: "Bánh bao nhân thịt linh thú hấp chín trong lồng trúc, bổ dưỡng khí huyết và hợp khẩu vị Phì Đế.",
    buyPriceLinhThach: 35,
    sellPriceLinhThach: 16,
    maxStack: 50,
    qualifiesForPhiDeQuest: true,
    buffSlot: "meal",
    buffDurationSec: 900,
    attackBonus: 12,
    defenseBonus: 6,
    hpRestore: 90,
    tuViMultiplier: 1.3
  },
  canh_truc_lang_linh_thao: {
    id: "canh_truc_lang_linh_thao",
    nameVi: "Canh Trúc Lang Linh Thảo",
    category: "food",
    descriptionVi: "Món canh thượng phẩm ninh từ Thịt Trúc Lang và Thanh Tâm Thảo, đại bổ nguyên khí.",
    buyPriceLinhThach: null,
    sellPriceLinhThach: 28,
    maxStack: 50,
    qualifiesForPhiDeQuest: true,
    buffSlot: "meal",
    buffDurationSec: 1200,
    attackBonus: 15,
    defenseBonus: 8,
    hpRestore: 120,
    tuViMultiplier: 1.4
  },
  tra_thanh_tam_tinh_khi: {
    id: "tra_thanh_tam_tinh_khi",
    nameVi: "Trà Thanh Tâm Tinh Khí",
    category: "beverage",
    descriptionVi: "Linh trà ủ từ lá trúc non và sương sớm, giúp định tâm ngưng thần (thay thế mỹ tửu an toàn).",
    buyPriceLinhThach: 20,
    sellPriceLinhThach: 10,
    maxStack: 50,
    qualifiesForPhiDeQuest: false,
    buffSlot: "beverage",
    buffDurationSec: 600,
    attackBonus: 4,
    defenseBonus: 5,
    hpRestore: 30,
    tuViMultiplier: 1.15
  },
  tu_khi_dan_so_cap: {
    id: "tu_khi_dan_so_cap",
    nameVi: "Tụ Khí Đan Sơ Cấp",
    category: "pill",
    descriptionVi: "Đan dược cơ bản giúp tăng 65 Tu Vi tức thì và trợ lực đột phá cảnh giới.",
    buyPriceLinhThach: 40,
    sellPriceLinhThach: 20,
    maxStack: 99,
    qualifiesForPhiDeQuest: false,
    buffSlot: "pill",
    buffDurationSec: 300,
    hpRestore: 50,
    tuViGrant: 65,
    tuViMultiplier: 1.2
  },
  bot_linh_mach: {
    id: "bot_linh_mach",
    nameVi: "Bột Linh Mạch",
    category: "ingredient",
    descriptionVi: "Bột lúa mạch thấm đẫm linh khí đồng nội, nguyên liệu chính để chế biến Mì Linh Mạch.",
    buyPriceLinhThach: 10,
    sellPriceLinhThach: 5,
    maxStack: 99,
    qualifiesForPhiDeQuest: false
  },
  thanh_tam_thao: {
    id: "thanh_tam_thao",
    nameVi: "Thanh Tâm Thảo",
    category: "ingredient",
    descriptionVi: "Linh thảo mọc trong Thanh Trúc Lâm, dùng để nấu linh thiện hoặc luyện đan.",
    buyPriceLinhThach: 12,
    sellPriceLinhThach: 6,
    maxStack: 99,
    qualifiesForPhiDeQuest: false
  },
  thit_truc_lang: {
    id: "thit_truc_lang",
    nameVi: "Thịt Trúc Lang",
    category: "ingredient",
    descriptionVi: "Thịt săn chắc thu được khi đánh bại Trúc Lang ở Thanh Trúc Lâm, giàu tinh huyết.",
    buyPriceLinhThach: null,
    sellPriceLinhThach: 14,
    maxStack: 99,
    qualifiesForPhiDeQuest: false
  },
   nanh_truc_lang: {
    id: "nanh_truc_lang",
    nameVi: "Nanh Trúc Lang",
    category: "material",
    descriptionVi: "Nanh sắc nhọn của Trúc Lang, có thể bán lấy Linh Thạch hoặc rèn pháp khí.",
    buyPriceLinhThach: null,
    sellPriceLinhThach: 15,
    maxStack: 99,
    qualifiesForPhiDeQuest: false
  },
  vay_thanh_lan: {
    id: "vay_thanh_lan",
    nameVi: "Vảy Thanh Lân Xà",
    category: "material",
    descriptionVi: "Lân phiến xanh biếc của Thanh Lân Xà, chứa linh lực mộc-thủy.",
    buyPriceLinhThach: null,
    sellPriceLinhThach: 18,
    maxStack: 99,
    qualifiesForPhiDeQuest: false
  },
  thanh_van_kiem_so_cap: {
    id: "thanh_van_kiem_so_cap",
    nameVi: "Thanh Vân Kiếm (Khởi Đầu)",
    category: "equipment",
    descriptionVi: "Trường kiếm nhập môn của đệ tử Tông Môn 8D.",
    buyPriceLinhThach: null,
    sellPriceLinhThach: 30,
    maxStack: 1,
    qualifiesForPhiDeQuest: false,
    attackBonus: 10
  }
};

export interface CulinaryRecipeDefinition {
  id: string;
  nameVi: string;
  outputItemId: string;
  outputQuantity: number;
  defaultQuality: FoodQualityTier;
  ingredients: Array<{ itemId: string; quantity: number }>;
  tuViReward: number;
}

export const RECIPES_REGISTRY: Record<string, CulinaryRecipeDefinition> = {
  cook_mi_linh_thach_thanh_truc: {
    id: "cook_mi_linh_thach_thanh_truc",
    nameVi: "Nấu Mì Linh Mạch Thanh Trúc",
    outputItemId: "mi_linh_thach_thanh_truc",
    outputQuantity: 1,
    defaultQuality: "ngon_mieng",
    ingredients: [
      { itemId: "bot_linh_mach", quantity: 1 },
      { itemId: "thanh_tam_thao", quantity: 1 }
    ],
    tuViReward: 25
  },
  cook_canh_truc_lang_linh_thao: {
    id: "cook_canh_truc_lang_linh_thao",
    nameVi: "Ninh Canh Trúc Lang Linh Thảo",
    outputItemId: "canh_truc_lang_linh_thao",
    outputQuantity: 1,
    defaultQuality: "thuong_pham",
    ingredients: [
      { itemId: "thit_truc_lang", quantity: 1 },
      { itemId: "thanh_tam_thao", quantity: 1 }
    ],
    tuViReward: 40
  }
};

export interface SkillDefinition {
  id: "basic_slash" | "kiem_khi_ung" | "ho_the_kim_quang";
  nameVi: string;
  keybindLabel: string;
  cooldownMs: number;
  mpCost: number;
  rangePx: number;
  coefficient: number;
  minDamage: number;
}

export const SKILLS_REGISTRY: Record<string, SkillDefinition> = {
  basic_slash: {
    id: "basic_slash",
    nameVi: "Thanh Vân Trảm",
    keybindLabel: "J",
    cooldownMs: 450,
    mpCost: 0,
    rangePx: 92,
    coefficient: 1.0,
    minDamage: 8
  },
  kiem_khi_ung: {
    id: "kiem_khi_ung",
    nameVi: "Kiếm Khí Phá Không",
    keybindLabel: "K",
    cooldownMs: 2200,
    mpCost: 12,
    rangePx: 145,
    coefficient: 1.75,
    minDamage: 18
  },
  ho_the_kim_quang: {
    id: "ho_the_kim_quang",
    nameVi: "Mỹ Vị Hóa Linh Trận",
    keybindLabel: "L",
    cooldownMs: 4000,
    mpCost: 18,
    rangePx: 120,
    coefficient: 1.5,
    minDamage: 15
  }
};

export interface MonsterDefinition {
  id: string;
  nameVi: string;
  spriteKey: string;
  maxHp: number;
  attack: number;
  defense: number;
  moveSpeedPxPerSec: number;
  aggroRangePx: number;
  attackRangePx: number;
  leashRangePx: number;
  telegraphMs: number;
  attackCooldownMs: number;
  respawnMs: number;
  tuViReward: number;
  linhThachReward: number;
  lootTable: Array<{ itemId: string; chance: number; minQty: number; maxQty: number }>;
}

export const MONSTERS_REGISTRY: Record<string, MonsterDefinition> = {
  truc_lang: {
    id: "truc_lang",
    nameVi: "Trúc Lang",
    spriteKey: "truc_lang",
    maxHp: 110,
    attack: 14,
    defense: 6,
    moveSpeedPxPerSec: 84,
    aggroRangePx: 150,
    attackRangePx: 54,
    leashRangePx: 260,
    telegraphMs: 650,
    attackCooldownMs: 1800,
    respawnMs: 7000,
    tuViReward: 38,
    linhThachReward: 18,
    lootTable: [
      { itemId: "thit_truc_lang", chance: 1.0, minQty: 1, maxQty: 1 },
      { itemId: "thanh_tam_thao", chance: 0.75, minQty: 1, maxQty: 2 },
      { itemId: "nanh_truc_lang", chance: 0.5, minQty: 1, maxQty: 1 }
    ]
  },
  thanh_lan_xa: {
    id: "thanh_lan_xa",
    nameVi: "Thanh Lân Xà",
    spriteKey: "thanh_lan_xa",
    maxHp: 145,
    attack: 18,
    defense: 8,
    moveSpeedPxPerSec: 76,
    aggroRangePx: 140,
    attackRangePx: 62,
    leashRangePx: 240,
    telegraphMs: 700,
    attackCooldownMs: 2000,
    respawnMs: 8500,
    tuViReward: 52,
    linhThachReward: 24,
    lootTable: [
      { itemId: "vay_thanh_lan", chance: 1.0, minQty: 1, maxQty: 1 },
      { itemId: "thanh_tam_thao", chance: 0.85, minQty: 1, maxQty: 2 }
    ]
  }
};

export interface PortalDefinition {
  id: string;
  labelVi: string;
  sourceZoneId: ZoneId;
  x: number;
  y: number;
  radiusPx: number;
  targetZoneId: ZoneId;
  targetSpawnId: string;
  targetX: number;
  targetY: number;
}

export interface ZoneDefinition {
  id: ZoneId;
  nameVi: string;
  subtitleVi: string;
  mapFile: string;
  widthTiles: number;
  heightTiles: number;
  tileSize: number;
  isSafeZone: boolean;
  defaultSpawn: { id: string; x: number; y: number };
  spawns: Record<string, { x: number; y: number }>;
  portals: PortalDefinition[];
  monsterSpawns: Array<{ instanceId: string; monsterId: string; x: number; y: number }>;
}

export const ZONES_REGISTRY: Record<ZoneId, ZoneDefinition> = {
  tan_thu_thon: {
    id: "tan_thu_thon",
    nameVi: "Tân Thủ Thôn",
    subtitleVi: "Thôn trang linh khí quy tụ dưới chân Bát Đại Thiên Tông",
    mapFile: "maps/tan_thu_thon.tmj",
    widthTiles: 40,
    heightTiles: 30,
    tileSize: 32,
    isSafeZone: true,
    defaultSpawn: { id: "village_center", x: 640, y: 512 },
    spawns: {
      village_center: { x: 640, y: 512 },
      from_thanh_truc_lam: { x: 1036, y: 480 }
    },
    portals: [
      {
        id: "portal_town_to_forest",
        labelVi: "Truyền Tống Trận → Thanh Trúc Lâm",
        sourceZoneId: "tan_thu_thon",
        x: 1120,
        y: 480,
        radiusPx: 92,
        targetZoneId: "thanh_truc_lam",
        targetSpawnId: "from_tan_thu_thon",
        targetX: 212,
        targetY: 480
      }
    ],
    monsterSpawns: []
  },
  thanh_truc_lam: {
    id: "thanh_truc_lam",
    nameVi: "Thanh Trúc Lâm",
    subtitleVi: "Rừng trúc ngàn năm ẩn chứa linh thú và tiên thảo",
    mapFile: "maps/thanh_truc_lam.tmj",
    widthTiles: 44,
    heightTiles: 32,
    tileSize: 32,
    isSafeZone: false,
    defaultSpawn: { id: "from_tan_thu_thon", x: 212, y: 480 },
    spawns: {
      from_tan_thu_thon: { x: 212, y: 480 },
      forest_shrine: { x: 640, y: 480 }
    },
    portals: [
      {
        id: "portal_forest_to_town",
        labelVi: "Truyền Tống Trận → Tân Thủ Thôn",
        sourceZoneId: "thanh_truc_lam",
        x: 128,
        y: 480,
        radiusPx: 92,
        targetZoneId: "tan_thu_thon",
        targetSpawnId: "from_thanh_truc_lam",
        targetX: 1036,
        targetY: 480
      }
    ],
    monsterSpawns: [
      { instanceId: "mob_truc_lang_1", monsterId: "truc_lang", x: 544, y: 480 },
      { instanceId: "mob_truc_lang_2", monsterId: "truc_lang", x: 768, y: 576 },
      { instanceId: "mob_thanh_lan_xa_1", monsterId: "thanh_lan_xa", x: 896, y: 416 },
      { instanceId: "mob_thanh_lan_xa_2", monsterId: "thanh_lan_xa", x: 672, y: 736 }
    ]
  }
};

export interface QuestDefinition {
  id: string;
  chapterIndex: number;
  npcId: string;
  titleVi: string;
  summaryVi: string;
  acceptDialogueVi: string;
  submitDialogueVi: string;
  eligibleItemIds: string[];
  rewardTuVi: number;
  rewardLinhThach: number;
  rewardItemId?: string;
  rewardItemQty?: number;
  rewardTitleVi?: string;
  grantsPhiDeBlessing: boolean;
}

export const QUESTS_REGISTRY: Record<string, QuestDefinition> = {
  phi_de_ch1_huong_thom: {
    id: "phi_de_ch1_huong_thom",
    chapterIndex: 1,
    npcId: "phi_de",
    titleVi: "Vạn Vị Thành Đạo (Chương 1): Hương Thơm Tân Thủ Thôn",
    summaryVi: "Mua một món ăn hợp lệ tại Quán Mì Lão Trù Trương HOẶC tự nấu bên Thần Đỉnh rồi dâng lên Phì Đế.",
    acceptDialogueVi: "Khá lắm! Muốn bước vào Ẩm Thực Đại Đạo của bổn tọa, hãy mang tới đây một bát Mì Linh Mạch Thanh Trúc, Bánh Bao Linh Thú hoặc Canh Trúc Lang Linh Thảo. Ngươi tự nấu hay mua sẵn ở chỗ Lão Trù Trương đều được công nhận!",
    submitDialogueVi: "Hảo hương vị! Linh khí hòa quyện trong từng sợi mì, bất kể là ngươi tự nấu hay biết chọn mua đúng mỹ vị nhân gian, đạo tâm ấy xứng đáng nhận Thực Đạo Kim Quang Chúc Phúc của bổn tọa!",
    eligibleItemIds: [
      "mi_linh_thach_thanh_truc",
      "banh_bao_linh_thu",
      "canh_truc_lang_linh_thao"
    ],
    rewardTuVi: 150,
    rewardLinhThach: 60,
    rewardItemId: "tu_khi_dan_so_cap",
    rewardItemQty: 1,
    rewardTitleVi: "Thực Đạo Hữu Duyên Nhân",
    grantsPhiDeBlessing: true
  }
};

export const INITIAL_DISCIPLINE_STATS: Record<
  CombatDisciplineId,
  { nameVi: string; hp: number; mp: number; attack: number; defense: number }
> = {
  kiem_tu: {
    nameVi: "Kiếm Tu",
    hp: 160,
    mp: 80,
    attack: 24,
    defense: 10
  },
  phap_tu: {
    nameVi: "Pháp Tu",
    hp: 140,
    mp: 120,
    attack: 27,
    defense: 8
  },
  the_tu: {
    nameVi: "Thể Tu",
    hp: 210,
    mp: 65,
    attack: 20,
    defense: 15
  }
};

export const COMBAT_MITIGATION_K = 40;
export const OFFLINE_MEDITATION_CAP_SECONDS = 8 * 3600;

export function computeActualDamage(
  attackerAttack: number,
  skillCoefficient: number,
  targetDefense: number,
  minDamage: number
): number {
  const rawDamage = attackerAttack * skillCoefficient;
  const mitigation = targetDefense / (targetDefense + COMBAT_MITIGATION_K);
  return Math.max(minDamage, Math.round(rawDamage * (1 - mitigation)));
}

export function getRealmRequiredTuVi(realmId: CanonicalRealmId, stage: number): number {
  const def = REALM_PROGRESSION.find((r) => r.id === realmId) ?? REALM_PROGRESSION[0];
  const clampedStage = Math.max(1, Math.min(def.stageCount, stage));
  return Math.round(def.baseTuViPerStage * Math.pow(def.stageTuViMultiplier, clampedStage - 1));
}

export function getNextRealmAndStage(
  realmId: CanonicalRealmId,
  stage: number
): { realmId: CanonicalRealmId; stage: number; isMajorBreakthrough: boolean } | null {
  const def = REALM_PROGRESSION.find((r) => r.id === realmId);
  if (!def) {
    return null;
  }
  if (stage < def.stageCount) {
    return { realmId, stage: stage + 1, isMajorBreakthrough: false };
  }
  const nextRealm = REALM_PROGRESSION.find((r) => r.orderIndex === def.orderIndex + 1);
  if (!nextRealm) {
    return null;
  }
  return { realmId: nextRealm.id, stage: 1, isMajorBreakthrough: true };
}

export function computeOfflineMeditationReward(
  elapsedSeconds: number,
  realmId: CanonicalRealmId,
  tuViMultiplier: number
): { cappedSeconds: number; tuViGained: number } {
  const safeElapsed = Math.max(0, Math.floor(elapsedSeconds));
  const cappedSeconds = Math.min(safeElapsed, OFFLINE_MEDITATION_CAP_SECONDS);
  const def = REALM_PROGRESSION.find((r) => r.id === realmId) ?? REALM_PROGRESSION[0];
  const boundedMult = Math.max(1.0, Math.min(2.5, tuViMultiplier));
  const tuViGained = Math.floor(cappedSeconds * def.baseMeditationRatePerSec * boundedMult);
  return { cappedSeconds, tuViGained };
}

export function formatRealmDisplay(realmId: CanonicalRealmId, stage: number): string {
  const def = REALM_PROGRESSION.find((r) => r.id === realmId);
  if (!def) {
    return "Phàm Nhân";
  }
  const subLabel = def.subStageLabels[Math.max(0, Math.min(def.subStageLabels.length - 1, stage - 1))] ?? "";
  return subLabel ? `${def.nameVi} • ${subLabel}` : def.nameVi;
}

export const BASE_ATTRIBUTE_KEYS: readonly BaseAttributeKey[] = Object.freeze([
  "the_phach",
  "luc_dao",
  "linh_tinh",
  "than_phap",
  "than_thuc",
  "ngo_tinh"
]);

export function isBaseAttributeKey(value: unknown): value is BaseAttributeKey {
  return typeof value === "string" && (BASE_ATTRIBUTE_KEYS as readonly string[]).includes(value);
}

export function createZeroBaseAttributes(): BaseAttributes {
  return {
    the_phach: 0,
    luc_dao: 0,
    linh_tinh: 0,
    than_phap: 0,
    than_thuc: 0,
    ngo_tinh: 0
  };
}

export function sumBaseAttributes(attrs: BaseAttributes): number {
  return (
    attrs.the_phach +
    attrs.luc_dao +
    attrs.linh_tinh +
    attrs.than_phap +
    attrs.than_thuc +
    attrs.ngo_tinh
  );
}

export type BaseAttributesValidationResult =
  | { ok: true; value: BaseAttributes }
  | {
      ok: false;
      code:
        | "INVALID_ATTRIBUTES_OBJECT"
        | "MISSING_ATTRIBUTE_KEY"
        | "EXTRA_ATTRIBUTE_KEY"
        | "INVALID_ATTRIBUTE_VALUE";
    };

export function validateBaseAttributes(attrs: unknown): BaseAttributesValidationResult {
  if (typeof attrs !== "object" || attrs === null || Array.isArray(attrs)) {
    return { ok: false, code: "INVALID_ATTRIBUTES_OBJECT" };
  }
  const record = attrs as Record<string, unknown>;
  const keys = Object.keys(record);
  for (const reqKey of BASE_ATTRIBUTE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(record, reqKey)) {
      return { ok: false, code: "MISSING_ATTRIBUTE_KEY" };
    }
  }
  for (const k of keys) {
    if (!isBaseAttributeKey(k)) {
      return { ok: false, code: "EXTRA_ATTRIBUTE_KEY" };
    }
  }
  const out = createZeroBaseAttributes();
  for (const reqKey of BASE_ATTRIBUTE_KEYS) {
    const rawVal = record[reqKey];
    if (typeof rawVal !== "number" || !Number.isSafeInteger(rawVal) || rawVal < 0) {
      return { ok: false, code: "INVALID_ATTRIBUTE_VALUE" };
    }
    out[reqKey] = rawVal;
  }
  return { ok: true, value: out };
}

const NON_NEGATIVE_DECIMAL_INT_PATTERN = /^(0|[1-9]\d*)$/;

export function isNonNegativeDecimalIntString(value: unknown): value is string {
  return typeof value === "string" && NON_NEGATIVE_DECIMAL_INT_PATTERN.test(value);
}

export function parseExpDecimalString(value: unknown): bigint | null {
  if (!isNonNegativeDecimalIntString(value)) {
    return null;
  }
  return BigInt(value);
}

export function formatExpDecimalString(value: unknown): string | null {
  if (typeof value !== "bigint" || value < 0n) {
    return null;
  }
  return value.toString(10);
}

export type CharacterLevelProgressValidationResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "INVALID_PROGRESS_OBJECT"
        | "INVALID_LEVEL"
        | "INVALID_EXP_DECIMAL_STRING"
        | "INVALID_FREE_POINTS"
        | "INVALID_ALLOCATED_ATTRIBUTES"
        | "INVALID_EARNED_PERMANENT_ATTRIBUTES"
        | "LEVEL_POINT_INVARIANT_MISMATCH";
    };

export function validateCharacterLevelProgress(
  progress: unknown
): CharacterLevelProgressValidationResult {
  if (typeof progress !== "object" || progress === null || Array.isArray(progress)) {
    return { ok: false, code: "INVALID_PROGRESS_OBJECT" };
  }
  const p = progress as Record<string, unknown>;
  if (typeof p.level !== "number" || !Number.isSafeInteger(p.level) || p.level < 1) {
    return { ok: false, code: "INVALID_LEVEL" };
  }
  if (!isNonNegativeDecimalIntString(p.expTowardNext)) {
    return { ok: false, code: "INVALID_EXP_DECIMAL_STRING" };
  }
  if (
    typeof p.freeAttributePoints !== "number" ||
    !Number.isSafeInteger(p.freeAttributePoints) ||
    p.freeAttributePoints < 0
  ) {
    return { ok: false, code: "INVALID_FREE_POINTS" };
  }
  const allocCheck = validateBaseAttributes(p.allocated);
  if (!allocCheck.ok) {
    return { ok: false, code: "INVALID_ALLOCATED_ATTRIBUTES" };
  }
  const earnedCheck = validateBaseAttributes(p.earnedPermanent);
  if (!earnedCheck.ok) {
    return { ok: false, code: "INVALID_EARNED_PERMANENT_ATTRIBUTES" };
  }
  const totalFromLevel = sumBaseAttributes(allocCheck.value) + p.freeAttributePoints;
  if (totalFromLevel !== p.level - 1) {
    return { ok: false, code: "LEVEL_POINT_INVARIANT_MISMATCH" };
  }
  return { ok: true };
}

export type AllocateSingleAttributeResult =
  | { ok: true; next: CharacterLevelProgress }
  | {
      ok: false;
      code:
        | "INVALID_PROGRESS_STATE"
        | "INVALID_ATTRIBUTE_KEY"
        | "INSUFFICIENT_FREE_POINTS";
    };

export function allocateSingleAttributePoint(
  progress: CharacterLevelProgress,
  key: unknown
): AllocateSingleAttributeResult {
  const valid = validateCharacterLevelProgress(progress);
  if (!valid.ok) {
    return { ok: false, code: "INVALID_PROGRESS_STATE" };
  }
  if (!isBaseAttributeKey(key)) {
    return { ok: false, code: "INVALID_ATTRIBUTE_KEY" };
  }
  if (progress.freeAttributePoints < 1) {
    return { ok: false, code: "INSUFFICIENT_FREE_POINTS" };
  }
  const nextAllocated: BaseAttributes = {
    ...progress.allocated,
    [key]: progress.allocated[key] + 1
  };
  const nextEarnedPermanent: BaseAttributes = {
    ...progress.earnedPermanent
  };
  return {
    ok: true,
    next: {
      level: progress.level,
      expTowardNext: progress.expTowardNext,
      freeAttributePoints: progress.freeAttributePoints - 1,
      allocated: nextAllocated,
      earnedPermanent: nextEarnedPermanent
    }
  };
}

export const DESTINY_RARITIES: readonly DestinyRarity[] = Object.freeze([
  "pham",
  "hoang",
  "tien",
  "than"
]);

export const CANONICAL_LEGENDARY_NPC_IDS: readonly string[] = Object.freeze(
  LEGENDARY_NPCS.filter((n) => n.isLegendaryTen).map((n) => n.id)
);

export type DestinyDefinitionMetadataValidationResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "INVALID_DEFINITION_OBJECT"
        | "INVALID_TRAIT_ID"
        | "INVALID_DISPLAY_NAME"
        | "INVALID_RARITY"
        | "INVALID_KIND"
        | "INVALID_APPROVAL_STATE"
        | "SIGNATURE_MUST_BE_THAN_RARITY"
        | "SIGNATURE_REQUIRES_CANONICAL_NPC_ID"
        | "ORDINARY_TRAIT_CANNOT_BIND_LEGENDARY_NPC";
    };

export function validateDestinyDefinitionMetadata(
  def: unknown
): DestinyDefinitionMetadataValidationResult {
  if (typeof def !== "object" || def === null || Array.isArray(def)) {
    return { ok: false, code: "INVALID_DEFINITION_OBJECT" };
  }
  const d = def as Record<string, unknown>;
  if (typeof d.id !== "string" || d.id.trim().length === 0) {
    return { ok: false, code: "INVALID_TRAIT_ID" };
  }
  if (typeof d.displayNameVi !== "string" || d.displayNameVi.trim().length === 0) {
    return { ok: false, code: "INVALID_DISPLAY_NAME" };
  }
  if (typeof d.rarity !== "string" || !(DESTINY_RARITIES as readonly string[]).includes(d.rarity)) {
    return { ok: false, code: "INVALID_RARITY" };
  }
  if (d.kind !== "ordinary" && d.kind !== "legendary_signature") {
    return { ok: false, code: "INVALID_KIND" };
  }
  if (d.ownerApprovalState !== "APPROVED" && d.ownerApprovalState !== "PROPOSED") {
    return { ok: false, code: "INVALID_APPROVAL_STATE" };
  }
  if (d.kind === "legendary_signature") {
    if (d.rarity !== "than") {
      return { ok: false, code: "SIGNATURE_MUST_BE_THAN_RARITY" };
    }
    if (
      typeof d.legendaryNpcId !== "string" ||
      !CANONICAL_LEGENDARY_NPC_IDS.includes(d.legendaryNpcId)
    ) {
      return { ok: false, code: "SIGNATURE_REQUIRES_CANONICAL_NPC_ID" };
    }
  } else {
    if (d.legendaryNpcId !== null) {
      return { ok: false, code: "ORDINARY_TRAIT_CANNOT_BIND_LEGENDARY_NPC" };
    }
  }
  return { ok: true };
}

export type DestinyTripleValidationResult =
  | { ok: true; signatureTraitId: string | null }
  | {
      ok: false;
      code:
        | "INVALID_TRIPLE_LENGTH"
        | "UNKNOWN_OR_INVALID_TRAIT"
        | "DUPLICATE_TRAIT_IN_TRIPLE"
        | "MULTIPLE_LEGENDARY_SIGNATURES";
    };

function lookupValidatedDestinyTrait(
  traitId: unknown,
  catalog: Readonly<Record<string, DestinyDefinitionMetadata>>
): DestinyDefinitionMetadata | null {
  if (typeof traitId !== "string" || traitId.trim().length === 0) {
    return null;
  }
  if (!Object.prototype.hasOwnProperty.call(catalog, traitId)) {
    return null;
  }
  const def = catalog[traitId];
  if (!def || def.id !== traitId) {
    return null;
  }
  const check = validateDestinyDefinitionMetadata(def);
  return check.ok ? def : null;
}

export function validateDestinyTripleIds(
  traitIds: unknown,
  catalog: Readonly<Record<string, DestinyDefinitionMetadata>>
): DestinyTripleValidationResult {
  if (!Array.isArray(traitIds) || traitIds.length !== 3) {
    return { ok: false, code: "INVALID_TRIPLE_LENGTH" };
  }
  const seen = new Set<string>();
  let signatureTraitId: string | null = null;
  for (const rawId of traitIds) {
    const def = lookupValidatedDestinyTrait(rawId, catalog);
    if (!def) {
      return { ok: false, code: "UNKNOWN_OR_INVALID_TRAIT" };
    }
    if (seen.has(def.id)) {
      return { ok: false, code: "DUPLICATE_TRAIT_IN_TRIPLE" };
    }
    seen.add(def.id);
    if (def.kind === "legendary_signature") {
      if (signatureTraitId !== null) {
        return { ok: false, code: "MULTIPLE_LEGENDARY_SIGNATURES" };
      }
      signatureTraitId = def.id;
    }
  }
  return { ok: true, signatureTraitId };
}

export type DestinyRollDraftShapeValidationResult =
  | { ok: true; signatureTraitId: string | null }
  | {
      ok: false;
      code:
        | "INVALID_DRAFT_OBJECT"
        | "INVALID_CREATION_ID"
        | "INVALID_ROLL_NONCE"
        | "INVALID_EXPIRES_AT"
        | "INVALID_TRIPLE_LENGTH"
        | "UNKNOWN_OR_INVALID_TRAIT"
        | "DUPLICATE_TRAIT_IN_TRIPLE"
        | "MULTIPLE_LEGENDARY_SIGNATURES";
    };

export function validateDestinyRollDraftShape(
  draft: unknown,
  catalog: Readonly<Record<string, DestinyDefinitionMetadata>>
): DestinyRollDraftShapeValidationResult {
  if (typeof draft !== "object" || draft === null || Array.isArray(draft)) {
    return { ok: false, code: "INVALID_DRAFT_OBJECT" };
  }
  const d = draft as Record<string, unknown>;
  if (typeof d.characterCreationId !== "string" || d.characterCreationId.trim().length === 0) {
    return { ok: false, code: "INVALID_CREATION_ID" };
  }
  if (typeof d.rollNonce !== "string" || d.rollNonce.trim().length === 0) {
    return { ok: false, code: "INVALID_ROLL_NONCE" };
  }
  if (typeof d.expiresAtMs !== "number" || !Number.isSafeInteger(d.expiresAtMs) || d.expiresAtMs <= 0) {
    return { ok: false, code: "INVALID_EXPIRES_AT" };
  }
  return validateDestinyTripleIds(d.candidateTraitIds, catalog);
}

export function getOwnedDestinyTraitIds(collection: DestinyCollection): Set<string> {
  return new Set<string>([...collection.innate, ...collection.acquiredTraitIds]);
}

export function hasOwnedDestinyTrait(collection: DestinyCollection, traitId: string): boolean {
  if (typeof traitId !== "string" || traitId.trim().length === 0) {
    return false;
  }
  return getOwnedDestinyTraitIds(collection).has(traitId);
}

export type DestinyCollectionValidationResult =
  | { ok: true; ownedLegendarySignatureId: string | null }
  | {
      ok: false;
      code:
        | "INVALID_COLLECTION_OBJECT"
        | "INVALID_TRIPLE_LENGTH"
        | "UNKNOWN_OR_INVALID_TRAIT"
        | "DUPLICATE_TRAIT_IN_TRIPLE"
        | "INVALID_CONFIRM_TIMESTAMP"
        | "INVALID_COLLECTION_REVISION"
        | "INVALID_ACQUIRED_LIST"
        | "DUPLICATE_ACQUIRED_TRAIT"
        | "INNATE_ACQUIRED_OVERLAP"
        | "MULTIPLE_LEGENDARY_SIGNATURES"
        | "INVALID_ACTIVE_SLOTS_TUPLE"
        | "UNOWNED_ACTIVE_SLOT_TRAIT"
        | "DUPLICATE_ACTIVE_SLOT_TRAIT";
    };

export function validateDestinyCollection(
  collection: unknown,
  catalog: Readonly<Record<string, DestinyDefinitionMetadata>>
): DestinyCollectionValidationResult {
  if (typeof collection !== "object" || collection === null || Array.isArray(collection)) {
    return { ok: false, code: "INVALID_COLLECTION_OBJECT" };
  }
  const c = collection as Record<string, unknown>;
  const innateRes = validateDestinyTripleIds(c.innate, catalog);
  if (!innateRes.ok) {
    return innateRes;
  }
  if (
    typeof c.innateConfirmedAtMs !== "number" ||
    !Number.isSafeInteger(c.innateConfirmedAtMs) ||
    c.innateConfirmedAtMs <= 0
  ) {
    return { ok: false, code: "INVALID_CONFIRM_TIMESTAMP" };
  }
  if (
    typeof c.collectionRevision !== "number" ||
    !Number.isSafeInteger(c.collectionRevision) ||
    c.collectionRevision < 1
  ) {
    return { ok: false, code: "INVALID_COLLECTION_REVISION" };
  }
  if (!Array.isArray(c.acquiredTraitIds)) {
    return { ok: false, code: "INVALID_ACQUIRED_LIST" };
  }
  const innateSet = new Set<string>(c.innate as string[]);
  const acquiredSet = new Set<string>();
  let ownedSignatureId = innateRes.signatureTraitId;

  for (const rawId of c.acquiredTraitIds) {
    const def = lookupValidatedDestinyTrait(rawId, catalog);
    if (!def) {
      return { ok: false, code: "UNKNOWN_OR_INVALID_TRAIT" };
    }
    if (innateSet.has(def.id)) {
      return { ok: false, code: "INNATE_ACQUIRED_OVERLAP" };
    }
    if (acquiredSet.has(def.id)) {
      return { ok: false, code: "DUPLICATE_ACQUIRED_TRAIT" };
    }
    acquiredSet.add(def.id);
    if (def.kind === "legendary_signature") {
      if (ownedSignatureId !== null) {
        return { ok: false, code: "MULTIPLE_LEGENDARY_SIGNATURES" };
      }
      ownedSignatureId = def.id;
    }
  }

  if (!Array.isArray(c.activeAcquiredSlots) || c.activeAcquiredSlots.length !== 3) {
    return { ok: false, code: "INVALID_ACTIVE_SLOTS_TUPLE" };
  }
  const activeSeen = new Set<string>();
  for (const slotVal of c.activeAcquiredSlots) {
    if (slotVal === null) {
      continue;
    }
    if (typeof slotVal !== "string" || !acquiredSet.has(slotVal)) {
      return { ok: false, code: "UNOWNED_ACTIVE_SLOT_TRAIT" };
    }
    if (activeSeen.has(slotVal)) {
      return { ok: false, code: "DUPLICATE_ACTIVE_SLOT_TRAIT" };
    }
    activeSeen.add(slotVal);
  }

  return { ok: true, ownedLegendarySignatureId: ownedSignatureId };
}

export interface RealmLevelBand {
  realmId: CanonicalRealmId;
  orderIndex: number;
  stageCount: number;
  minLevel: number;
  maxLevel: number | null;
  postBreakthroughMinLevel: number;
}

export function getRealmLevelBand(realmId: unknown): RealmLevelBand | null {
  if (typeof realmId !== "string") {
    return null;
  }
  const def = REALM_PROGRESSION.find((r) => r.id === realmId);
  if (!def) {
    return null;
  }
  if (def.orderIndex === 0) {
    return {
      realmId: def.id,
      orderIndex: 0,
      stageCount: def.stageCount,
      minLevel: 1,
      maxLevel: 10,
      postBreakthroughMinLevel: 1
    };
  }
  const isSaintRealm = def.id === "thanh_canh";
  const minLevel = 11 + 20 * (def.orderIndex - 1);
  const maxLevel = isSaintRealm ? null : 30 + 20 * (def.orderIndex - 1);
  return {
    realmId: def.id,
    orderIndex: def.orderIndex,
    stageCount: def.stageCount,
    minLevel,
    maxLevel,
    postBreakthroughMinLevel: minLevel - 1
  };
}

export function isValidRealmStage(realmId: unknown, realmStage: unknown): boolean {
  const band = getRealmLevelBand(realmId);
  if (!band || typeof realmStage !== "number" || !Number.isSafeInteger(realmStage)) {
    return false;
  }
  return realmStage >= 1 && realmStage <= band.stageCount;
}

export function isLevelAllowedForRealm(realmId: unknown, level: unknown): boolean {
  const band = getRealmLevelBand(realmId);
  if (!band || typeof level !== "number" || !Number.isSafeInteger(level)) {
    return false;
  }
  if (level < band.postBreakthroughMinLevel) {
    return false;
  }
  if (band.maxLevel !== null && level > band.maxLevel) {
    return false;
  }
  return true;
}

export function isAtNonSaintMajorRealmLevelCap(realmId: unknown, level: unknown): boolean {
  const band = getRealmLevelBand(realmId);
  if (!band || typeof level !== "number" || !Number.isSafeInteger(level)) {
    return false;
  }
  return band.maxLevel !== null && level === band.maxLevel;
}

export function meetsMajorRealmBreakthroughLevelAndStagePrerequisite(
  realmId: unknown,
  realmStage: unknown,
  level: unknown
): boolean {
  const band = getRealmLevelBand(realmId);
  if (!band || band.maxLevel === null) {
    return false;
  }
  if (!isValidRealmStage(realmId, realmStage) || !isLevelAllowedForRealm(realmId, level)) {
    return false;
  }
  return realmStage === band.stageCount && level === band.maxLevel;
}
