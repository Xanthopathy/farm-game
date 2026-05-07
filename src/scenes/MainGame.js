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

    this.day = 1;
    this.dayTime = 60000;
    this.dayTimer = 0;
    this.isDayActive = true;
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
        TILE_TYPES.GRASS.frames.default,
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
        WORLD_OBJECTS.BIN.frames.default,
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

    const KeyCodes = Phaser.Input.Keyboard.KeyCodes;
    this.player = new Player(this, 10, 6, this.tileSize);
    this.spaceBar = this.input.keyboard.addKey(KeyCodes.SPACE);
    this.shift = this.input.keyboard.addKey(KeyCodes.SHIFT);
    this.gKey = this.input.keyboard.addKey(KeyCodes.G);
    this.bKey = this.input.keyboard.addKey(KeyCodes.B);
    this.showDebugGrid = false;
    this.showDebugText = false;

    this.input.on("pointerdown", (pointer) => {
      if (pointer.leftButtonDown()) {
        this.handleInteraction();
      }
    });

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
    this.player.update(delta);

    // Loop through the grid and update any existing crops
    this.grid.forEach((row) => {
      row.forEach((tile) => {
        if (tile.crop) {
          tile.crop.update(delta, tile.isWatered);
        }
      });
    });

    if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
      this.handleInteraction();
    }

    if (this.shift.isDown) {
      this.player.speed = 60;
    }

    if (Phaser.Input.Keyboard.JustDown(this.gKey)) {
      this.showDebugGrid = !this.showDebugGrid;
    }

    if (Phaser.Input.Keyboard.JustDown(this.bKey)) {
      this.showDebugText = !this.showDebugText;
    }

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

    if (this.isDayActive) {
      this.dayTimer += delta;
      if (this.dayTimer >= this.dayTime) {
        this.endDay();
      }
    }
  }

  endDay() {
    // Not meant to be final result as we want harvest & selling to be in the day and endDay to check if you met quota
    this.isDayActive = false;
    // Auto-harvest all ripe crops
    this.grid.forEach((row) => {
      row.forEach((tile) => {
        if (tile.crop && tile.crop.isMature) {
          const harvested = tile.harvest();
          if (harvested) this.inventory.push(harvested);
        }
      });
    });
    // Sell inventory
    this.sellCrops();
    // Reset for next day
    this.day++;
    this.dayTimer = 0;
    this.water = this.maxWater;
    this.isDayActive = true;
    console.log(`Day ${this.day} started!`);
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
    const tool = this.player.currentTool;
    const duration = tool === TOOLS.NONE ? 0 : 250;
    let frame = tool.frames.default;
    if (tool === TOOLS.BUCKET && this.water === 0) {
      frame = tool.frames.empty;
    }

    // Check if target is within the bounds of our grid array
    // const tile =
    //   this.grid[targetY] && this.grid[targetY][targetX]
    //     ? this.grid[targetY][targetX]
    //     : null;
    const tile = this.grid[targetY]?.[targetX] ?? null;

    this.player.performAction(duration, () => {
      this.handleObjectInteraction(targetX, targetY, tool) ||
        this.handleTileInteraction(tile, tool);
    }, frame);
  }

  handleObjectInteraction(targetX, targetY, tool) {
    // Well (9, 4 with a top half)
    if (
      targetX === 9 &&
      (targetY === 3 || targetY === 4) &&
      tool === TOOLS.BUCKET
    ) {
      this.water = this.maxWater;
      console.log(`Water refilled: ${this.water}/${this.maxWater}`);
      return true;
    }

    // Shipping Bin (15, 4)
    if (targetX === 15 && targetY === 4) {
      if (this.inventory.length > 0) {
        this.sellCrops();
      } else {
        console.log("Inventory empty!");
      }
      return true;
    }
    return false;
  }

  handleTileInteraction(tile, tool) {
    if (!tile) return;

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
          console.log("Out of water!");
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
    }
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
