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
