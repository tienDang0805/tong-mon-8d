import Phaser from "phaser";
import { SoundController } from "./audio.js";
import { GameNetworkClient } from "./network.js";
import { WorldScene } from "./WorldScene.js";
import { HudOverlayController } from "./hud.js";
import { CharacterCreationOverlayController } from "./characterCreation.js";

async function bootstrapGame(): Promise<void> {
  const soundCtrl = new SoundController();
  const worldScene = new WorldScene();
  let hud: HudOverlayController | null = null;
  let charCreate: CharacterCreationOverlayController | null = null;

  const net = new GameNetworkClient({
    onSelfState: (state) => {
      worldScene.syncSelfState(state);
      hud?.refreshPanels(state);
    },
    onSelfStateV02: (state) => {
      charCreate?.onSelfStateV02(state);
      hud?.refreshPanels();
    },
    onGuestAuthResult: (result) => {
      charCreate?.onGuestAuthResult(result);
    },
    onCharacterV02ActionResult: (result) => {
      charCreate?.onCharacterV02ActionResult(result);
      hud?.onCharacterV02ActionResult(result);
    },
    onWorldSnapshot: (snapshot) => {
      worldScene.syncWorldSnapshot(snapshot);
      hud?.refreshPanels(undefined, snapshot);
    },
    onActionResult: (result) => {
      hud?.onActionResult(result);
    },
    onCombatEvent: (event) => {
      worldScene.playCombatEventVisual(event);
    },
    onChatMessage: (msg) => {
      hud?.onChatMessage(msg);
    },
    onZoneChanged: (zoneId, spawnX, spawnY) => {
      worldScene.switchZone(zoneId, spawnX, spawnY);
      hud?.refreshPanels();
    }
  });

  worldScene.bindSystems(net, soundCtrl, (npc) => {
    hud?.openNpcDialogue(npc);
  });

  const hudRoot = document.getElementById("hud-overlay");
  if (hudRoot) {
    hud = new HudOverlayController(hudRoot, net, soundCtrl, () => worldScene);
    charCreate = new CharacterCreationOverlayController(hudRoot, net, soundCtrl);
  }

  await net.connect();

  const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: "phaser-container",
    width: window.innerWidth || 1280,
    height: window.innerHeight || 720,
    backgroundColor: "#0e1520",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [worldScene]
  };

  new Phaser.Game(gameConfig);
}

bootstrapGame().catch((err) => {
  console.error("Failed to bootstrap Tông Môn 8D:", err);
});
