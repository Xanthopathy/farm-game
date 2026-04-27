// src/scenes/MainGame.js
import * as Phaser from "phaser";
import { Scene } from "phaser";
import { Player } from "../entities/Player";
import { getGridCoords } from "../utils/GridMath";
import { DebugDisplay } from "../utils/Debug";
import { Tile } from "../entities/Tile";

export class MainGame extends Scene {
  constructor() {
    super("MainGame"); // This name is how we switch between scenes later
  }

  init() {
    // Use this for defining variables
    this.grid = []; // Array to store tile data
    this.tileSize = 32;
    this.offsetX = 80;
    this.offsetY = 180; // Leaving for UI
    this.debugDisplay = null;
  }

  preload() {
    // Load images: (key, path)
    this.load.image("player", "assets/player.png");
    this.load.image("dirt", "assets/dirt.png");
    this.load.image("tilled", "assets/tilled.png");
    this.load.image("watered", "assets/watered.png"); // Not yet
    this.load.image("path", "assets/path.png");
  }

  create() {
    const cols = 21;
    const rows = 13;

    // Building the grid
    for (let y = 0; y < rows; y++) {
      this.grid[y] = [];
      for (let x = 0; x < cols; x++) {
        // Position = index * size + offset (to center it a bit)
        const posX = x * this.tileSize + this.offsetX;
        const posY = y * this.tileSize + this.offsetY;

        // Draw the "Outline" for the whole screen area
        // .setStrokeStyle(thickness, color) makes it an empty box
        this.add
          .rectangle(posX, posY, this.tileSize, this.tileSize)
          .setStrokeStyle(1, 0x333333);

        // Logic for the "Plus" Path
        // We find the middle column and middle row
        const isMiddleCol = x === Math.floor(cols / 2);
        const isMiddleRow = y === Math.floor(rows / 2);
        const type = !isMiddleCol && !isMiddleRow ? "DIRT" : "PATH";

        this.grid[y][x] = new Tile(this, posX, posY, type);
      }
    }
    this.player = new Player(this, 400, 140);
    this.spaceBar = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );

    this.debugDisplay = new DebugDisplay(this);
  }

  update(time, delta) {
    this.player.update(delta);

    this.debugDisplay.update(
      this.player,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );

    if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
      this.handleInteraction();
    }
  }

  handleInteraction() {
    const { gridX, gridY } = getGridCoords(
      this.player.x,
      this.player.y,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );

    // Check if player is within the bounds of our grid array
    if (this.grid[gridY] && this.grid[gridY][gridX]) {
      const tile = this.grid[gridY][gridX];

      if (!tile.isTilled) {
        tile.till();
      } else if (!tile.isWatered) {
        tile.water();
      }
    }
  }
}
