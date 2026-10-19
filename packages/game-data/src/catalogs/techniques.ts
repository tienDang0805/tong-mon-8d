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
