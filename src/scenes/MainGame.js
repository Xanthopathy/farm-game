// src/scenes/MainGame.js
import * as Phaser from "phaser";
import { Scene } from "phaser";
import { Player } from "../entities/Player";
import { getGridCoords, getPixelCoords } from "../utils/GridMath";
import { DebugDisplay } from "../utils/Debug";
import { UIDisplay } from "../utils/UIDisplay";
import { createStack } from "../utils/SpriteUtils";
import { Tile } from "../entities/Tile";
import {
  DEPTHS,
  TILE_TYPES,
  CROP_TYPES,
  WORLD_OBJECTS,
  TOOLS,
} from "../constants";

export class MainGame extends Scene {
  constructor() {
    super("MainGame"); // This name is how we switch between scenes later
  }

  init() {
    // Use this for defining variables
    this.grid = []; // Array to store tile data
    this.decorations = []; // Separate layer for flexible sprite placement
    this.tileSize = 32;

    this.debugDisplay = null;
    this.uiDisplay = null;

    this.gold = 0;
    this.water = 10;
    this.maxWater = 10;
    this.inventory = [];
    // TODO: Make UI bar for Gold and tool selection (water is shown as a value bottom right of bucket/can icon)
  }

  preload() {
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

    this.load.spritesheet("player_idle", "assets/player/idle.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("player_walk", "assets/player/walk.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
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
        const { x: posX, y: posY } = getPixelCoords(x, y, this.tileSize);

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

    // Place bin at grid (15, 4)
    const binPixels = getPixelCoords(15, 4, this.tileSize);
    this.shippingBin = this.add
      .sprite(
        binPixels.x,
        binPixels.y,
        WORLD_OBJECTS.BIN.texture,
        WORLD_OBJECTS.BIN.frame,
      )
      .setScale(2)
      .setDepth(DEPTHS.OBJECTS);

    // Place well at grid (9, 4)
    const wellPixels = getPixelCoords(9, 4, this.tileSize);
    this.well = createStack(
      this,
      wellPixels.x,
      wellPixels.y,
      WORLD_OBJECTS.WELL,
      DEPTHS.OBJECTS,
      DEPTHS.CROP_TOP,
    );

    // Create player at grid (10, 6)
    const KeyCodes = Phaser.Input.Keyboard.KeyCodes;
    this.player = new Player(this, 10, 6, this.tileSize);
    this.spaceBar = this.input.keyboard.addKey(KeyCodes.SPACE);
    this.shift = this.input.keyboard.addKey(KeyCodes.SHIFT);
    this.gKey = this.input.keyboard.addKey(KeyCodes.G);
    this.bKey = this.input.keyboard.addKey(KeyCodes.B);
    this.showDebugGrid = false;
    this.showDebugText = false;

    this.debugDisplay = new DebugDisplay(this);
    this.uiDisplay = new UIDisplay(this);
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

    if (Phaser.Input.Keyboard.JustDown(this.bKey)) {
      this.showDebugText = !this.showDebugText;
    }

    if (this.shift.isDown) {
      this.player.speed = 60;
    }

    this.player.update(delta);

    // Calculate target coordinates based on player facing
    this.calculateTargetCoordinates();

    this.debugDisplay.update(
      this.player,
      this.tileSize,
      this.showDebugGrid,
      this.showDebugText,
      this.targetX,
      this.targetY,
    );

    this.uiDisplay.update(this.player, this);

    if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
      this.handleInteraction();
    }
  }

  calculateTargetCoordinates() {
    const { gridX, gridY } = getGridCoords(
      this.player.x,
      this.player.y,
      this.tileSize,
    );

    this.targetX = gridX;
    this.targetY = gridY;

    switch (this.player.facing) {
      case "up":
        this.targetY -= 1;
        break;
      case "down":
        this.targetY += 1;
        break;
      case "left":
        this.targetX -= 1;
        break;
      case "right":
        this.targetX += 1;
        break;
    }
  }

  handleInteraction() {
    if (this.player.isBusy) return;

    const targetX = this.targetX;
    const targetY = this.targetY;

    // Check if target is within the bounds of our grid array
    const tile =
      this.grid[targetY] && this.grid[targetY][targetX]
        ? this.grid[targetY][targetX]
        : null;
    const tool = this.player.currentTool;

    // Static object interaction (check regardless of tool)
    // Well (9, 4 with a top half)
    if (targetX === 9 && (targetY === 3 || targetY === 4)) {
      this.player.performAction(500, () => {
        this.water = this.maxWater;
        console.log(`Water refilled: ${this.water}/${this.maxWater}`);
      });
      return;
    }

    // Shipping Bin (15, 4)
    if (targetX === 15 && targetY === 4) {
      if (this.inventory.length > 0) {
        this.player.performAction(300, () => this.sellCrops());
      } else {
        console.log("Inventory empty!");
      }
      return;
    }

    // Tile-based interaction
    if (!tile) return;

    this.player.performAction(250, () => {
      switch (tool) {
        case TOOLS.HOE:
          tile.till();
          break;

        case TOOLS.SEEDS:
          tile.plant(CROP_TYPES.CORN);
          break;

        case TOOLS.BUCKET:
          if (this.water > 0) {
            if (tile.isTilled && !tile.isWatered) {
              tile.water();
              this.water--;
              console.log(`Water left: ${this.water}`);
            }
          } else {
            console.log("Out of water! Refill at the well!");
          }
          break;

        case TOOLS.SCYTHE:
          const harvested = tile.harvest();
          if (harvested) {
            this.inventory.push(harvested);
            console.log(`Stored ${harvested.cropName} in inventory`);
          }
          break;

        default:
          console.log("No tool equipped!");
          break;
      }
    });
  }

  sellCrops() {
    let totalGain = 0;
    this.inventory.forEach((item) => {
      totalGain += item.sellValue;
    });

    this.gold += totalGain;
    this.inventory = []; // Clear inventory
    console.log(`Sold shipment for ${totalGain}g! Total Gold: ${this.gold}`);
  }
}
