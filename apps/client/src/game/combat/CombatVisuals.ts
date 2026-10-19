import type Phaser from "phaser";
import type { CombatEventPayload, Direction } from "@tong-mon-8d/shared";

export class CombatVisuals {
  constructor(private readonly scene: Phaser.Scene) {}

  public playCombatEventVisual(ev: CombatEventPayload): void {
    const hitSpark = this.scene.add
      .sprite(ev.x, ev.y - 22, "combat_vfx", 4)
      .setScale(0.85)
      .setDepth(ev.y + 24);
    hitSpark.play("vfx_kiem_khi_ung");
    hitSpark.once("animationcomplete", () => hitSpark.destroy());

    const isKill = ev.killed;
    const dmgText = this.scene.add
      .text(ev.x, ev.y - 36, isKill ? `-${ev.damage} TRẢM!` : `-${ev.damage}`, {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: isKill ? "15px" : "13px",
        fontStyle: "bold",
        color: isKill ? "#ffd452" : "#ff6b6b",
        stroke: "#080b12",
        strokeThickness: 3
      })
      .setOrigin(0.5, 0.5)
      .setDepth(4500);

    this.scene.tweens.add({
      targets: dmgText,
      y: ev.y - 72,
      alpha: 0,
      duration: 720,
      ease: "Cubic.easeOut",
      onComplete: () => dmgText.destroy()
    });
  }

  public playCeremonyEffect(x: number, y: number): void {
    const ring = this.scene.add
      .sprite(x, y - 16, "combat_vfx", 12)
      .setScale(1.4)
      .setDepth(y + 24);
    ring.play("vfx_lotus_cast");
    this.scene.tweens.add({
      targets: ring,
      scale: 2.2,
      alpha: 0,
      duration: 1100,
      onComplete: () => ring.destroy()
    });
  }

  public spawnSlashEffect(
    x: number,
    y: number,
    dir: Direction,
    skillId: string
  ): void {
    const offsetMap: Record<Direction, { dx: number; dy: number; rot: number }> = {
      down: { dx: 0, dy: 28, rot: Math.PI / 2 },
      up: { dx: 0, dy: -28, rot: -Math.PI / 2 },
      left: { dx: -28, dy: 0, rot: Math.PI },
      right: { dx: 28, dy: 0, rot: 0 }
    };
    const off = offsetMap[dir];
    if (skillId === "ho_the_kim_quang") {
      const shield = this.scene.add
        .sprite(x, y - 20, "combat_vfx", 8)
        .setScale(1.25)
        .setDepth(y + 24);
      shield.play("vfx_ho_the_kim_quang");
      this.scene.tweens.add({
        targets: shield,
        scale: 1.5,
        alpha: 0,
        duration: 460,
        onComplete: () => shield.destroy()
      });
      return;
    }

    const animKey = skillId === "basic_slash" ? "vfx_slash_arc" : "vfx_kiem_khi_ung";
    const startFrame = skillId === "basic_slash" ? 0 : 4;
    const fx = this.scene.add
      .sprite(x + off.dx, y - 20 + off.dy, "combat_vfx", startFrame)
      .setRotation(skillId === "basic_slash" ? off.rot : 0)
      .setScale(skillId === "basic_slash" ? 1.05 : 1.3)
      .setDepth(y + 24);
    fx.play(animKey);
    fx.once("animationcomplete", () => fx.destroy());
  }

  public spawnNpcCastEffect(x: number, y: number): void {
    const fx = this.scene.add
      .sprite(x, y - 18, "combat_vfx", 12)
      .setScale(1.25)
      .setDepth(y + 24);
    fx.play("vfx_lotus_cast");
    fx.once("animationcomplete", () => fx.destroy());
  }
}
