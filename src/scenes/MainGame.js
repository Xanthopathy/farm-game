// src/scene/MainGame.js
import * as Phaser from "phaser";
import { Scene } from "phaser";
import { CROP_TYPES, DEPTHS, TOOLS, WORLD_OBJECTS } from "../constants";
import { loadSpritesheets } from "../config/Assets";
import {
  PLAYER_SPEED,
  PLAYER_START,
  WORLD_LAYOUT,
  WORLD_OBJECT_POSITIONS,
} from "../config/WorldConfig";
import { Player } from "../entities/Player";
import { GameState } from "../systems/GameState";
import { TerrainManager } from "../systems/TerrainManager";
import { getGridCoords, getPixelCoords } from "../utils/GridMath";
import { DebugDisplay } from "../utils/Debug";
import { UIDisplay } from "../utils/UIDisplay";
import { createStack } from "../utils/SpriteUtils";

export class MainGame extends Scene {
  constructor() {
    super("MainGame");
  }

  init() {
    this.state = new GameState();
    this.terrain = null;
    this.player = null;
    this.targetX = PLAYER_START.gridX;
    this.targetY = PLAYER_START.gridY + 1;

    this.hasShownDayEndingWarning = false;

    this.debugDisplay = null;
    this.uiDisplay = null;
    this.showDebugGrid = false;
    this.showDebugText = false;
  }

  preload() {
    loadSpritesheets(this);
  }

  create() {
    this.input.mouse.disableContextMenu();

    this.terrain = new TerrainManager(this, WORLD_LAYOUT);
    this.terrain.create();
    this.placeWorldObjects();

    this.player = new Player(
      this,
      PLAYER_START.gridX,
      PLAYER_START.gridY,
      WORLD_LAYOUT.tileSize,
    );

    this.createInput();
    this.debugDisplay = new DebugDisplay(this);
    this.uiDisplay = new UIDisplay(this);
  }

  createInput() {
    const KeyCodes = Phaser.Input.Keyboard.KeyCodes;
    this.spaceBar = this.input.keyboard.addKey(KeyCodes.SPACE);
    this.shift = this.input.keyboard.addKey(KeyCodes.SHIFT);
    this.qKey = this.input.keyboard.addKey(KeyCodes.Q);
    this.eKey = this.input.keyboard.addKey(KeyCodes.E);
    this.gKey = this.input.keyboard.addKey(KeyCodes.G);
    this.bKey = this.input.keyboard.addKey(KeyCodes.B);

    this.input.on("pointerdown", (pointer) => {
      if (pointer.leftButtonDown()) {
        this.handleInteraction();
      }
    });

    this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
      if (deltaY !== 0) {
        this.player.cycleTool(deltaY > 0 ? 1 : -1);
      }
    });
  }

  placeWorldObjects() {
    const binPixels = getPixelCoords(
      WORLD_OBJECT_POSITIONS.bin.gridX,
      WORLD_OBJECT_POSITIONS.bin.gridY,
      WORLD_LAYOUT.tileSize,
    );
    this.shippingBin = this.add
      .sprite(
        binPixels.x,
        binPixels.y,
        WORLD_OBJECTS.BIN.texture,
        WORLD_OBJECTS.BIN.frames.default,
      )
      .setScale(2)
      .setDepth(DEPTHS.OBJECTS);

    const wellPixels = getPixelCoords(
      WORLD_OBJECT_POSITIONS.well.gridX,
      WORLD_OBJECT_POSITIONS.well.gridY,
      WORLD_LAYOUT.tileSize,
    );
    this.well = createStack(
      this,
      wellPixels.x,
      wellPixels.y,
      WORLD_OBJECTS.WELL,
      DEPTHS.OBJECTS,
      DEPTHS.CROP_TOP,
    );
  }

  update(time, delta) {
    if (!this.state.gameOver) {
      this.updatePlayer(delta);
      this.terrain.updateCrops(delta);
      this.handleKeyboardActions();
      this.calculateTargetCoordinates();
      this.showDayEndingWarning();

      if (this.state.updateDay(delta)) {
        this.endDay();
      }
    }

    this.debugDisplay.update(
      this.player,
      WORLD_LAYOUT.tileSize,
      this.showDebugGrid,
      this.showDebugText,
      this.targetX,
      this.targetY,
    );
    this.uiDisplay.update(this.player, this.state, this.debugDisplay);
  }

  updatePlayer(delta) {
    this.player.speed = this.shift.isDown
      ? PLAYER_SPEED.slow
      : PLAYER_SPEED.normal;
    this.player.update(delta);
  }

  handleKeyboardActions() {
    if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
      this.handleInteraction();
    }

    if (Phaser.Input.Keyboard.JustDown(this.gKey)) {
      this.showDebugGrid = !this.showDebugGrid;
    }

    if (Phaser.Input.Keyboard.JustDown(this.bKey)) {
      this.showDebugText = !this.showDebugText;
    }

    if (Phaser.Input.Keyboard.JustDown(this.qKey)) {
      this.cycleSelectedCrop(-1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.cycleSelectedCrop(1);
    }
  }

  cycleSelectedCrop(direction) {
    this.state.cycleSelectedCrop(direction);
    this.uiDisplay.showMessage(
      `Selected seeds: ${CROP_TYPES[this.state.selectedCropKey].name}`,
    );
  }

  /**
   * Facing-based interactions target the adjacent tile, not the tile underfoot.
   */
  calculateTargetCoordinates() {
    const { gridX, gridY } = getGridCoords(
      this.player.x,
      this.player.y,
      WORLD_LAYOUT.tileSize,
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
    if (this.player.isBusy || this.state.gameOver) return;

    const target = { x: this.targetX, y: this.targetY };
    const tool = this.player.currentTool;
    const tile = this.terrain.getTile(target.x, target.y);
    const duration = tool === TOOLS.NONE ? 0 : 500;
    const frame = this.getToolActionFrame(tool);

    this.player.performAction(
      duration,
      () => {
        this.handleObjectInteraction(target, tool) ||
          this.handleTileInteraction(tile, tool, target);
      },
      frame,
    );
  }

  getToolActionFrame(tool) {
    if (tool === TOOLS.NONE) return null;
    if (tool === TOOLS.BUCKET && this.state.water === 0) {
      return tool.frames.empty;
    }
    return tool.frames.default;
  }

  /**
   * World objects get priority over farm tiles so the well/bin can sit near
   * the grid without accidentally triggering tile behavior.
   */
  handleObjectInteraction(target, tool) {
    if (this.isWellTarget(target) && tool === TOOLS.BUCKET) {
      this.state.refillWater();
      this.uiDisplay.showMessage(
        `Water refilled: ${this.state.water}/${this.state.maxWater}`,
      );
      return true;
    }

    if (this.isShippingBinTarget(target)) {
      this.sellCrops();
      return true;
    }

    return false;
  }

  handleTileInteraction(tile, tool, target) {
    if (!tile) {
      this.uiDisplay.showMessage("Nothing to use that on");
      return;
    }

    switch (tool) {
      case TOOLS.HOE:
        if (tile.till()) {
          this.terrain.refreshTerrainBitmasksAround(target.x, target.y);
        } else {
          this.uiDisplay.showMessage("Needs untilled dirt");
        }
        break;

      case TOOLS.SEEDS:
        const cropType = CROP_TYPES[this.state.selectedCropKey];

        if (!tile.plant(cropType)) {
          this.uiDisplay.showMessage("Needs empty tilled soil");
        }
        break;

      case TOOLS.BUCKET:
        this.waterTile(tile, target);
        break;

      case TOOLS.SCYTHE:
        this.harvestTile(tile, target);
        break;

      default:
        this.uiDisplay.showMessage("No tool equipped!");
    }
  }

  waterTile(tile, target) {
    if (this.state.water <= 0) {
      this.uiDisplay.showMessage("Out of water");
      return;
    }

    if (!tile.isTilled) {
      this.uiDisplay.showMessage("Needs tilled soil");
      return;
    }

    if (tile.isWatered) {
      this.uiDisplay.showMessage("Already watered");
      return;
    }

    tile.water();
    this.terrain.refreshTilledBitmaskAt(target.x, target.y);
    this.state.spendWater();
    this.uiDisplay.showMessage(`Water left: ${this.state.water}`);
  }

  harvestTile(tile, target) {
    const harvested = tile.harvest();
    if (!harvested) {
      this.uiDisplay.showMessage("Crop not ready");
      return;
    }

    this.terrain.refreshTilledBitmaskAt(target.x, target.y);
    this.state.storeHarvest(harvested);
    this.uiDisplay.showMessage(`Stored ${harvested.cropName} in inventory`);
  }

  sellCrops() {
    if (this.state.inventory.length === 0) {
      this.uiDisplay.showMessage("Inventory empty!");
      return;
    }

    const totalGain = this.state.sellInventory();
    this.uiDisplay.showMessage(
      `Sold shipment for ${totalGain}g! Total Gold: ${this.state.gold}`,
    );
  }

  /**
   * Fire once per day so the long warning message is not reset every frame.
   */
  showDayEndingWarning() {
    const timeLeft = this.state.dayTime - this.state.dayTimer;

    if (this.hasShownDayEndingWarning || timeLeft > 10000) return;

    this.hasShownDayEndingWarning = true;
    this.uiDisplay.showMessage("Day ending soon!", 10000);
  }

  /**
   * Game-over messages stay pinned because gameplay stops updating.
   */
  endDay() {
    const result = this.state.endDay();

    if (!result.success) {
      this.uiDisplay.showMessage(result.message, Infinity);
      return;
    }

    this.terrain.resetWateredTiles();
    this.hasShownDayEndingWarning = false;

    this.uiDisplay.showMessage(result.message, 3000);

    if (result.nextDayMessage) {
      this.time.delayedCall(3200, () => {
        this.uiDisplay.showMessage(result.nextDayMessage, 7000);
      });
    }
  }

  isWellTarget(target) {
    const well = WORLD_OBJECT_POSITIONS.well;
    return (
      target.x === well.gridX &&
      (target.y === well.gridY || target.y === well.topGridY)
    );
  }

  isShippingBinTarget(target) {
    const bin = WORLD_OBJECT_POSITIONS.bin;
    return target.x === bin.gridX && target.y === bin.gridY;
  }
}
