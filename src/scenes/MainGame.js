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
  GRASS_BITMASK_TABLE,
  TILLED_BITMASK_TABLE,
} from "../constants";

const BITMASK_NEIGHBORS = [
  { dx: -1, dy: -1, value: 1 },
  { dx: 0, dy: -1, value: 2 },
  { dx: 1, dy: -1, value: 4 },
  { dx: -1, dy: 0, value: 8 },
  { dx: 1, dy: 0, value: 16 },
  { dx: -1, dy: 1, value: 32 },
  { dx: 0, dy: 1, value: 64 },
  { dx: 1, dy: 1, value: 128 },
];

export class MainGame extends Scene {
  constructor() {
    super("MainGame"); // This name is how we switch between scenes later
  }

  init() {
    // Use this for defining variables
    this.grid = []; // Array to store tile data
    this.grassTiles = []; // Background grass sprites by grid coordinate
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
    this.quota = 50; // Initial daily quota
    this.gameOver = false;
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
    this.input.mouse.disableContextMenu();

    const cols = 19;
    const rows = 11;
    const gridXOffset = 3;
    const gridYOffset = 6;

    // Create grass background tiles with variations for entire screen
    // Cover full screen width and height
    const maxGridX = Math.ceil(this.scale.width / this.tileSize) + 1;
    const maxGridY = Math.ceil(this.scale.height / this.tileSize) + 1;

    for (let y = 0; y < maxGridY; y++) {
      for (let x = 0; x < maxGridX; x++) {
        // Skip tiles that are part of the main grid (will be drawn as DIRT/PATH)
        if (
          x >= gridXOffset &&
          x < gridXOffset + cols &&
          y >= gridYOffset &&
          y < gridYOffset + rows
        ) {
          continue;
        }

        const { x: posX, y: posY } = getPixelCoords(x, y, this.tileSize);

        // Select frame: use variation with chance, otherwise default
        let frameToUse = TILE_TYPES.GRASS.frames.default;
        if (
          TILE_TYPES.GRASS.frames.variations &&
          TILE_TYPES.GRASS.variationChance &&
          Math.random() < TILE_TYPES.GRASS.variationChance
        ) {
          frameToUse = Phaser.Utils.Array.GetRandom(
            TILE_TYPES.GRASS.frames.variations,
          );
        }

        this.grassTiles[y] ??= [];
        const grass = this.add
          .sprite(posX, posY, TILE_TYPES.GRASS.texture, frameToUse)
          .setScale(2)
          .setDepth(DEPTHS.GRASS);
        grass.flatFrame = frameToUse;
        this.grassTiles[y][x] = grass;
      }
    }

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

    this.refreshTerrainBitmasks();

    // Place bin at grid (15, 3)
    const binPixels = getPixelCoords(15, 3, this.tileSize);
    this.shippingBin = this.add
      .sprite(
        binPixels.x,
        binPixels.y,
        WORLD_OBJECTS.BIN.texture,
        WORLD_OBJECTS.BIN.frames.default,
      )
      .setScale(2)
      .setDepth(DEPTHS.OBJECTS);

    // Place well at grid (9, 3)
    const wellPixels = getPixelCoords(9, 3, this.tileSize);
    this.well = createStack(
      this,
      wellPixels.x,
      wellPixels.y,
      WORLD_OBJECTS.WELL,
      DEPTHS.OBJECTS,
      DEPTHS.CROP_TOP,
    );

    const KeyCodes = Phaser.Input.Keyboard.KeyCodes;
    this.player = new Player(this, 12, 6, this.tileSize);
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

    this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
      if (deltaY === 0) return;
      this.player.cycleTool(deltaY > 0 ? 1 : -1);
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
    if (!this.gameOver) {
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

      if (this.isDayActive) {
        this.dayTimer += delta;
        if (this.dayTimer >= this.dayTime) {
          this.endDay();
        }
      }
    }

    this.debugDisplay.update(
      this.player,
      this.tileSize,
      this.showDebugGrid,
      this.showDebugText,
      this.targetX,
      this.targetY,
    );

    this.uiDisplay.update(this.player, this);
  }

  endDay() {
    // Check if player met the quota
    if (this.gold >= this.quota) {
      this.gold -= this.quota;
      console.log(
        `Paid quota of ${this.quota}g. Remaining gold: ${this.gold}g`,
      );

      // Increase quota of the day
      this.quota += 50;

      // Advance to the next day
      this.day++;
      this.dayTimer = 0;
      this.water = this.maxWater;
      this.isDayActive = true;
      console.log(`Day ${this.day} started! New quota: ${this.quota}g`);
    } else {
      console.log(
        `Failed to pay quota! Needed ${this.quota}g, had ${this.gold}g. Game Over!`,
      );
      this.gameOver = true;
      this.isDayActive = false;
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
    if (this.player.isBusy || this.gameOver) return;

    const targetX = this.targetX;
    const targetY = this.targetY;
    const tool = this.player.currentTool;
    const duration = tool === TOOLS.NONE ? 0 : 500;
    let frame = tool === TOOLS.NONE ? null : tool.frames.default;
    if (tool === TOOLS.BUCKET && this.water === 0) {
      frame = tool.frames.empty;
    }

    // Check if target is within the bounds of our grid array
    // const tile =
    //   this.grid[targetY] && this.grid[targetY][targetX]
    //     ? this.grid[targetY][targetX]
    //     : null;
    const tile = this.grid[targetY]?.[targetX] ?? null;

    this.player.performAction(
      duration,
      () => {
        this.handleObjectInteraction(targetX, targetY, tool) ||
          this.handleTileInteraction(tile, tool, targetX, targetY);
      },
      frame,
    );
  }

  handleObjectInteraction(targetX, targetY, tool) {
    // Well (9, 3 with a top half)
    if (
      targetX === 9 &&
      (targetY === 2 || targetY === 3) &&
      tool === TOOLS.BUCKET
    ) {
      this.water = this.maxWater;
      console.log(`Water refilled: ${this.water}/${this.maxWater}`);
      return true;
    }

    // Shipping Bin (15, 3)
    if (targetX === 15 && targetY === 3) {
      if (this.inventory.length > 0) {
        this.sellCrops();
      } else {
        console.log("Inventory empty!");
      }
      return true;
    }
    return false;
  }

  handleTileInteraction(tile, tool, targetX, targetY) {
    if (!tile) return;

    switch (tool) {
      case TOOLS.HOE:
        if (tile.till()) {
          this.refreshTerrainBitmasksAround(targetX, targetY);
        }
        break;

      case TOOLS.SEEDS:
        tile.plant(CROP_TYPES.CORN);
        break;

      case TOOLS.BUCKET:
        if (this.water > 0) {
          if (tile.isTilled && !tile.isWatered) {
            tile.water();
            this.refreshTilledBitmaskAt(targetX, targetY);
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
          this.refreshTilledBitmaskAt(targetX, targetY);
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

  refreshTerrainBitmasks() {
    for (let y = 0; y < this.grassTiles.length; y++) {
      const row = this.grassTiles[y];
      if (!row) continue;

      for (let x = 0; x < row.length; x++) {
        if (row[x]) {
          this.refreshGrassBitmaskAt(x, y);
        }
      }
    }

    this.grid.forEach((row, y) => {
      row?.forEach((tile, x) => {
        if (tile?.isTilled) {
          this.refreshTilledBitmaskAt(x, y);
        }
      });
    });
  }

  refreshTerrainBitmasksAround(centerX, centerY) {
    for (const { dx, dy } of [{ dx: 0, dy: 0 }, ...BITMASK_NEIGHBORS]) {
      const x = centerX + dx;
      const y = centerY + dy;

      this.refreshGrassBitmaskAt(x, y);

      const tile = this.grid[y]?.[x];
      if (tile?.isTilled) {
        this.refreshTilledBitmaskAt(x, y);
      }
    }
  }

  refreshGrassBitmaskAt(x, y) {
    const grass = this.grassTiles[y]?.[x];
    if (!grass) return;

    const mask = this.getCardinalGatedBitmask(x, y, (neighborX, neighborY) =>
      this.isGrassLike(neighborX, neighborY),
    );

    if (mask === 255) {
      grass.setFrame(grass.flatFrame);
      return;
    }

    grass.setFrame(GRASS_BITMASK_TABLE[mask] ?? grass.flatFrame);
  }

  refreshTilledBitmaskAt(x, y) {
    const tile = this.grid[y]?.[x];
    if (!tile?.isTilled) return;

    const mask = this.getCardinalGatedBitmask(x, y, (neighborX, neighborY) =>
      Boolean(this.grid[neighborY]?.[neighborX]?.isTilled),
    );
    const frame = TILLED_BITMASK_TABLE[mask] ?? TILE_TYPES.TILLED.frames.default;
    if (tile.isWatered) {
      tile.setTerrainFrame(this.getWateredTilledTextureKey(frame));
      return;
    }

    tile.setTerrainFrame(TILE_TYPES.TILLED.texture, frame);
  }

  getWateredTilledTextureKey(frame) {
    const key = `tilled-watered-${frame}`;
    if (this.textures.exists(key)) return key;

    const sourceFrame = this.textures.getFrame(TILE_TYPES.TILLED.texture, frame);
    const canvas = document.createElement("canvas");
    canvas.width = sourceFrame.cutWidth;
    canvas.height = sourceFrame.cutHeight;

    const context = canvas.getContext("2d");
    context.drawImage(
      sourceFrame.source.image,
      sourceFrame.cutX,
      sourceFrame.cutY,
      sourceFrame.cutWidth,
      sourceFrame.cutHeight,
      0,
      0,
      sourceFrame.cutWidth,
      sourceFrame.cutHeight,
    );

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (!this.isTilledSoilPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) {
        continue;
      }

      data[i] = Math.floor(data[i] * 0.7);
      data[i + 1] = Math.floor(data[i + 1] * 0.75);
      data[i + 2] = Math.floor(data[i + 2] * 0.85);
    }
    context.putImageData(imageData, 0, 0);

    const texture = this.textures.addCanvas(key, canvas);
    texture.refresh();

    return key;
  }

  isTilledSoilPixel(red, green, blue, alpha) {
    if (alpha === 0) return false;
    return red < 160 && red > green && green >= blue;
  }

  getBitmask(x, y, isMatchingNeighbor) {
    return BITMASK_NEIGHBORS.reduce((mask, { dx, dy, value }) => {
      return isMatchingNeighbor(x + dx, y + dy) ? mask + value : mask;
    }, 0);
  }

  getCardinalGatedBitmask(x, y, isMatchingNeighbor) {
    const north = isMatchingNeighbor(x, y - 1);
    const west = isMatchingNeighbor(x - 1, y);
    const east = isMatchingNeighbor(x + 1, y);
    const south = isMatchingNeighbor(x, y + 1);

    let mask = 0;
    if (north) mask += 2;
    if (west) mask += 8;
    if (east) mask += 16;
    if (south) mask += 64;

    if (north && west && isMatchingNeighbor(x - 1, y - 1)) mask += 1;
    if (north && east && isMatchingNeighbor(x + 1, y - 1)) mask += 4;
    if (south && west && isMatchingNeighbor(x - 1, y + 1)) mask += 32;
    if (south && east && isMatchingNeighbor(x + 1, y + 1)) mask += 128;

    return mask;
  }

  isGrassLike(x, y) {
    return !this.grid[y]?.[x];
  }
}
