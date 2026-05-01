// src/main.js
import * as Phaser from "phaser";
import { MainGame } from "./scenes/MainGame";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 640,
  parent: "game-container",
  pixelArt: true,
  render: {
    antiAlias: false,
    roundPixels: true,
  },
  scene: [MainGame],
};

const game = new Phaser.Game(config);
