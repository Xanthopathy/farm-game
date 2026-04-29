// src/scenes/MainGame.js
import * as Phaser from "phaser";
import { Scene } from "phaser";
import { Player } from "../entities/Player";
import { getGridCoords } from "../utils/GridMath";
import { DebugDisplay } from "../utils/Debug";
import { Tile } from "../entities/Tile";
import { DEPTHS, TILE_TYPES, CROP_TYPES } from "../constants";

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
    // Load the terrain (grass, water, paths) and objects (crops, fences, tools)
    this.load.spritesheet("terrain", "assets/terrain.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet("objects", "assets/objects.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    // Load images: (key, path)
    this.load.image("player", "assets/player.png");
  }

  create() {
    // Fill the entire screen with base grass (Frame 13 from terrain)
    this.add
      .tileSprite(
        0,
        0,
        this.scale.width,
        this.scale.height,
        TILE_TYPES.GRASS.texture,
        TILE_TYPES.GRASS.frame,
      )
      .setOrigin(0)
      .setTileScale(2)
      .setDepth(DEPTHS.GRASS);

    const cols = 21;
    const rows = 13;

    // Building the grid
    for (let y = 0; y < rows; y++) {
      this.grid[y] = [];
      for (let x = 0; x < cols; x++) {
        // Position = index * size + offset (to center it a bit)
        const posX = x * this.tileSize + this.offsetX;
        const posY = y * this.tileSize + this.offsetY;

        // Logic for the "Plus" Path
        // We find the middle column and middle row
        const isMiddleCol = x === Math.floor(cols / 2);
        const isMiddleRow = y === Math.floor(rows / 2);

        const isPath = isMiddleCol || isMiddleRow;
        const tileType = isPath ? "PATH" : "DIRT";
        const visualConfig = isPath ? TILE_TYPES.PATH : TILE_TYPES.DIRT;

        this.grid[y][x] = new Tile(this, posX, posY, tileType, visualConfig);
      }
    }
    this.player = new Player(this, 400, 140);
    this.spaceBar = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );

    this.debugDisplay = new DebugDisplay(this);
  }

  update(time, delta) {
    // Loop through the grid and update any existing crops
    this.grid.forEach((row) => {
      row.forEach((tile) => {
        if (tile.crop) {
          tile.crop.update(delta, tile.isWatered);
        }
      });
    });

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
      } else if (!tile.crop) {
        // If it's tilled but empty, plant a seed
        tile.plant(CROP_TYPES.WHEAT);
      } else if (!tile.isWatered) {
        tile.water();
      }
    }
  }
}
