// src/scenes/MainGame.js
import * as Phaser from "phaser";
import { Scene } from "phaser";
import { Player } from "../entities/Player";
import { getGridCoords, getPixelCoords } from "../utils/GridMath";
import { DebugDisplay } from "../utils/Debug";
import { createStack } from "../utils/SpriteUtils";
import { Tile } from "../entities/Tile";
import { DEPTHS, TILE_TYPES, CROP_TYPES, WORLD_OBJECTS } from "../constants";

export class MainGame extends Scene {
  constructor() {
    super("MainGame"); // This name is how we switch between scenes later
  }

  init() {
    // Use this for defining variables
    this.grid = []; // Array to store tile data
    this.decorations = []; // Separate layer for flexible sprite placement
    this.tileSize = 32;
    this.offsetX = 0; // Grid (0,0) is now at canvas top-left
    this.offsetY = 0; // Grid (0,0) is now at canvas top-left
    this.debugDisplay = null;

    this.gold = 0;
    this.water = 10;
    this.maxWater = 10;
    this.inventory = [];
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
    this.load.spritesheet("tiny_town", "assets/tiny_town.png", {
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
    const gridXOffset = 2;
    const gridYOffset = 6;

    // Building the grid
    for (let y = gridYOffset; y < rows + gridYOffset; y++) {
      this.grid[y] = [];
      for (let x = gridXOffset; x < cols + gridXOffset; x++) {
        // Convert grid coordinates to pixel position
        const { x: posX, y: posY } = getPixelCoords(
          x,
          y,
          this.tileSize,
          this.offsetX,
          this.offsetY,
        );

        // Logic for the "Plus" Path
        // We find the middle column and middle row
        const isMiddleCol = x === Math.floor(cols / 2 + gridXOffset);
        const isMiddleRow = y === Math.floor(rows / 2 + gridYOffset);

        const isPath = isMiddleCol || isMiddleRow;
        const tileType = isPath ? "PATH" : "DIRT";
        const visualConfig = isPath ? TILE_TYPES.PATH : TILE_TYPES.DIRT;

        this.grid[y][x] = new Tile(this, posX, posY, tileType, visualConfig);
      }
    }

    // Place bin at grid (5, 1)
    const binPixels = getPixelCoords(
      5,
      1,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );
    this.shippingBin = this.add
      .sprite(
        binPixels.x,
        binPixels.y,
        WORLD_OBJECTS.BIN.texture,
        WORLD_OBJECTS.BIN.frame,
      )
      .setScale(2)
      .setDepth(DEPTHS.OBJECTS);

    // Place well at grid (4, 4)
    const wellPixels = getPixelCoords(
      4,
      4,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );
    this.well = createStack(
      this,
      wellPixels.x,
      wellPixels.y,
      WORLD_OBJECTS.WELL,
      DEPTHS.OBJECTS,
      DEPTHS.CROP_TOP,
    );

    // Create player at grid (10, 6)
    this.player = new Player(
      this,
      10,
      6,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );
    this.spaceBar = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    this.gKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
    this.showDebugGrid = false;

    this.debugDisplay = new DebugDisplay(this);
  }

  /**
   * Helper method to place decorative sprites at grid coordinates
   * Perfect for placing objects from the spritesheet without being tied to the grid tile system
   */
  placeDecoration(
    gridX,
    gridY,
    texture,
    frame,
    scale = 1,
    depth = DEPTHS.OBJECTS,
  ) {
    const { x, y } = getPixelCoords(
      gridX,
      gridY,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );
    const sprite = this.add
      .sprite(x, y, texture, frame)
      .setScale(scale)
      .setDepth(depth);
    this.decorations.push(sprite);
    return sprite;
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

    if (Phaser.Input.Keyboard.JustDown(this.gKey)) {
      this.showDebugGrid = !this.showDebugGrid;
    }

    this.player.update(delta);

    this.debugDisplay.update(
      this.player,
      this.tileSize,
      this.offsetX,
      this.offsetY,
      this.showDebugGrid,
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
        tile.plant(CROP_TYPES.CORN);
      } else if (!tile.isWatered) {
        tile.water();
      }
    }
  }
}
