import * as Phaser from "phaser";
import { MainGame } from "./scenes/MainGame";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  pixelArt: true,
  scene: [MainGame],
};

const game = new Phaser.Game(config);
