import Phaser from "phaser";
import { SoundController } from "../audio.js";
import { GameNetworkClient } from "../network/GameNetworkClient.js";
import { WorldScene } from "../game/WorldScene.js";
import { HudOverlayController } from "../ui/HudShell.js";
import { CharacterCreationOverlayController } from "../features/character/CharacterCreationView.js";
import { EntryStateMachine } from "./entry/EntryStateMachine.js";

export async function bootstrapGame(): Promise<Phaser.Game> {
  const soundCtrl = new SoundController();
  const worldScene = new WorldScene();
  let hud: HudOverlayController | null = null;
  let charCreate: CharacterCreationOverlayController | null = null;
  let entryStateMachine: EntryStateMachine | null = null;

  const net = new GameNetworkClient({
    onSelfState: (state) => {
      charCreate?.onWorldEntered();
      worldScene.syncSelfState(state);
      hud?.refreshPanels(state);
      entryStateMachine?.publishGlobalTelemetry();
    },
    onSelfStateV02: (state) => {
      charCreate?.onSelfStateV02(state);
      hud?.refreshPanels();
      entryStateMachine?.publishGlobalTelemetry();
    },
    onGuestAuthResult: (result) => {
      charCreate?.onGuestAuthResult(result);
      entryStateMachine?.publishGlobalTelemetry();
    },
    onCharacterV02ActionResult: (result) => {
      charCreate?.onCharacterV02ActionResult(result);
      hud?.onCharacterV02ActionResult(result);
      entryStateMachine?.publishGlobalTelemetry();
    },
    onRosterUpdated: () => {
      entryStateMachine?.publishGlobalTelemetry();
    },
    onLeftWorldToMenu: () => {
      worldScene.resetToMenuState();
      hud?.refreshPanels();
      entryStateMachine?.publishGlobalTelemetry();
    },
    onWorldSnapshot: (snapshot) => {
      worldScene.syncWorldSnapshot(snapshot);
      hud?.refreshPanels(undefined, snapshot);
      entryStateMachine?.publishGlobalTelemetry();
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
      entryStateMachine?.publishGlobalTelemetry();
    }
  });

  entryStateMachine = new EntryStateMachine({
    getAccountId: () => (net.getGuestToken() || !net.isV02Mode() ? net.getAccountId() : null),
    getSelectedCharacterId: () => net.getSelectedCharacterId(),
    getRosterCount: () => net.rosterCharacters.length,
    isInWorld: () => worldScene.isPlayerInWorld(),
    getWorldActorCount: () => worldScene.getWorldActorCount()
  });

  if (!net.isV02Mode()) {
    entryStateMachine.setState("IN_WORLD");
  } else {
    entryStateMachine.setState("TITLE");
  }

  const hudRoot = document.getElementById("hud-overlay");
  if (hudRoot) {
    hud = new HudOverlayController(
      hudRoot,
      net,
      soundCtrl,
      () => worldScene,
      {
        getEntryFlowState: () => entryStateMachine!.getState(),
        onSwitchCharacterToRoster: async () => {
          await net.leaveWorldToMenu();
          worldScene.resetToMenuState();
          await charCreate?.openRosterFromWorld();
          hud?.refreshPanels();
          entryStateMachine?.publishGlobalTelemetry();
        },
        onReturnToTitle: async () => {
          await net.leaveWorldToMenu();
          worldScene.resetToMenuState();
          charCreate?.openTitleFromWorld();
          hud?.refreshPanels();
          entryStateMachine?.publishGlobalTelemetry();
        }
      }
    );
    charCreate = new CharacterCreationOverlayController(
      hudRoot,
      net,
      soundCtrl,
      entryStateMachine,
      () => {
        hud?.refreshPanels();
        entryStateMachine?.publishGlobalTelemetry();
      }
    );
  }

  worldScene.bindSystems(
    net,
    soundCtrl,
    (npc) => {
      hud?.openNpcDialogue(npc);
    },
    () => hud,
    () => entryStateMachine!.getState()
  );

  if (typeof window !== "undefined") {
    const win = window as unknown as Record<string, unknown>;
    Object.defineProperty(win, "__TONG_MON_ENTRY_STATE__", {
      configurable: true,
      enumerable: true,
      get: () => entryStateMachine!.getTelemetry(),
      set: () => {}
    });
    win.__TONG_MON_APP__ = {
      getEntryState: () => entryStateMachine!.getTelemetry(),
      leaveWorldToRoster: async () => {
        await net.leaveWorldToMenu();
        worldScene.resetToMenuState();
        await charCreate?.openRosterFromWorld();
        hud?.refreshPanels();
        return entryStateMachine!.publishGlobalTelemetry();
      },
      leaveWorldToTitle: async () => {
        await net.leaveWorldToMenu();
        worldScene.resetToMenuState();
        charCreate?.openTitleFromWorld();
        hud?.refreshPanels();
        return entryStateMachine!.publishGlobalTelemetry();
      }
    };
  }

  if (!net.isV02Mode()) {
    await net.connect();
  }

  const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: "phaser-container",
    width: window.innerWidth || 1280,
    height: window.innerHeight || 720,
    backgroundColor: "#0e1520",
    pixelArt: true,
    roundPixels: true,
    input: {
      mouse: {
        preventDefaultWheel: false
      }
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [worldScene]
  };

  return new Phaser.Game(gameConfig);
}
