import type { NpcRealmId, ZoneId } from "@tong-mon-8d/shared";

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
    spawnX: 1488,
    spawnY: 1072,
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
    spawnX: 2128,
    spawnY: 656,
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
    spawnX: 1648,
    spawnY: 1104,
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
    spawnX: 624,
    spawnY: 720,
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
    spriteKey: "npc_ngoc_tam",
    portraitKey: "portrait_npc_ngoc_tam",
    zoneId: "tan_thu_thon",
    spawnX: 656,
    spawnY: 1712,
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
    spriteKey: "thai_tai",
    portraitKey: "portrait_thai_tai",
    zoneId: "tan_thu_thon",
    spawnX: 2384,
    spawnY: 688,
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
    spawnX: 1136,
    spawnY: 1136,
    greetingLinesVi: [
      "Mì Linh Mạch nóng hổi, Bánh Bao Linh Thú thơm lừng đây! Mua ăn liền cũng đắc đạo, mà mua nguyên liệu về tự nấu bên Thần Đỉnh cũng thành tài!",
      "Vị tiền bối mặc cẩm bào gấu tiên ngồi bên Thần Đỉnh chính là Phì Đế đại nhân đấy, mau dâng một món ngon để cầu cơ duyên!"
    ],
    questlineTitleVi: "Ẩm Thực Nhập Môn",
    inheritanceSkillNameVi: "Không"
  }
];
