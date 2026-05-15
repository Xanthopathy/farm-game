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

  /**
   * Register player-facing input that belongs to the main play scene.
   */
  createInput() {
    const KeyCodes = Phaser.Input.Keyboard.KeyCodes;
    this.spaceBar = this.input.keyboard.addKey(KeyCodes.SPACE);
    this.shift = this.input.keyboard.addKey(KeyCodes.SHIFT);
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

  /**
   * Place fixed world objects that are not part of the farm tile grid.
   */
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

  /**
   * Update movement, crops, keyboard actions, targeting, and day progression.
   */
  update(time, delta) {
    if (!this.state.gameOver) {
      this.updatePlayer(delta);
      this.terrain.updateCrops(delta);
      this.handleKeyboardActions();
      this.calculateTargetCoordinates();

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
    this.uiDisplay.update(this.player, this.state);
  }

  /**
   * Apply movement speed modifiers before delegating to the player entity.
   */
  updatePlayer(delta) {
    this.player.speed = this.shift.isDown
      ? PLAYER_SPEED.slow
      : PLAYER_SPEED.normal;
    this.player.update(delta);
  }

  /**
   * Handle once-per-press keyboard actions for interaction and debug toggles.
   */
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
  }

  /**
   * Calculate the grid tile directly in front of the player's facing direction.
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

  /**
   * Start the current tool action against the captured target tile.
   */
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

  /**
   * Pick the correct tool animation frame for the current game state.
   */
  getToolActionFrame(tool) {
    if (tool === TOOLS.NONE) return null;
    if (tool === TOOLS.BUCKET && this.state.water === 0) {
      return tool.frames.empty;
    }
    return tool.frames.default;
  }

  /**
   * Handle interactions with fixed world objects before tile interactions.
   */
  handleObjectInteraction(target, tool) {
    if (this.isWellTarget(target) && tool === TOOLS.BUCKET) {
      this.state.refillWater();
      console.log(`Water refilled: ${this.state.water}/${this.state.maxWater}`);
      return true;
    }

    if (this.isShippingBinTarget(target)) {
      this.sellCrops();
      return true;
    }

    return false;
  }

  /**
   * Apply the selected tool's behavior to a farm-grid tile.
   */
  handleTileInteraction(tile, tool, target) {
    if (!tile) return;

    switch (tool) {
      case TOOLS.HOE:
        if (tile.till()) {
          this.terrain.refreshTerrainBitmasksAround(target.x, target.y);
        }
        break;

      case TOOLS.SEEDS:
        tile.plant(CROP_TYPES.CORN);
        break;

      case TOOLS.BUCKET:
        this.waterTile(tile, target);
        break;

      case TOOLS.SCYTHE:
        this.harvestTile(tile, target);
        break;

      default:
        console.log("No tool equipped!");
    }
  }

  /**
   * Water a dry tilled tile and refresh its terrain texture.
   */
  waterTile(tile, target) {
    if (this.state.water <= 0) {
      console.log("Out of water!");
      return;
    }

    if (!tile.isTilled || tile.isWatered) return;

    tile.water();
    this.terrain.refreshTilledBitmaskAt(target.x, target.y);
    this.state.spendWater();
    console.log(`Water left: ${this.state.water}`);
  }

  /**
   * Harvest a mature crop and move it into shipment inventory.
   */
  harvestTile(tile, target) {
    const harvested = tile.harvest();
    if (!harvested) return;

    this.terrain.refreshTilledBitmaskAt(target.x, target.y);
    this.state.storeHarvest(harvested);
    console.log(`Stored ${harvested.cropName} in inventory`);
  }

  /**
   * Sell all harvested crops currently held in shipment inventory.
   */
  sellCrops() {
    if (this.state.inventory.length === 0) {
      console.log("Inventory empty!");
      return;
    }

    const totalGain = this.state.sellInventory();
    console.log(
      `Sold shipment for ${totalGain}g! Total Gold: ${this.state.gold}`,
    );
  }

  /**
   * Resolve end-of-day quota logic and log the result.
   */
  endDay() {
    const result = this.state.endDay();
    console.log(result.message);
    if (result.nextDayMessage) {
      console.log(result.nextDayMessage);
    }
  }

  /**
   * Check whether the target tile overlaps the well interaction area.
   */
  isWellTarget(target) {
    const well = WORLD_OBJECT_POSITIONS.well;
    return (
      target.x === well.gridX &&
      (target.y === well.gridY || target.y === well.topGridY)
    );
  }

  /**
   * Check whether the target tile is the shipping bin interaction area.
   */
  isShippingBinTarget(target) {
    const bin = WORLD_OBJECT_POSITIONS.bin;
    return target.x === bin.gridX && target.y === bin.gridY;
  }
}
