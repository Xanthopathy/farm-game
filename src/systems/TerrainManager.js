// src/systems/TerrainManager.js
import * as Phaser from "phaser";
import { Tile } from "../entities/Tile";
import {
  DEPTHS,
  GRASS_BITMASK_TABLE,
  TILE_TYPES,
  TILLED_BITMASK_TABLE,
} from "../constants";
import { getPixelCoords } from "../utils/GridMath";

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

export class TerrainManager {
  constructor(scene, layout) {
    this.scene = scene;
    this.layout = layout;
    this.tileSize = layout.tileSize;
    this.grid = [];
    this.grassTiles = [];
    this.decorations = [];
  }

  /**
   * Build the visible terrain layers and apply initial edge bitmasks.
   */
  create() {
    this.createGrassBackground();
    this.createFarmGrid();
    this.refreshTerrainBitmasks();
  }

  /**
   * Fill the screen outside the farm grid with randomized flat grass sprites.
   */
  createGrassBackground() {
    const { cols, rows, gridXOffset, gridYOffset } = this.layout;
    const maxGridX = Math.ceil(this.scene.scale.width / this.tileSize) + 1;
    const maxGridY = Math.ceil(this.scene.scale.height / this.tileSize) + 1;

    for (let y = 0; y < maxGridY; y++) {
      for (let x = 0; x < maxGridX; x++) {
        if (
          x >= gridXOffset &&
          x < gridXOffset + cols &&
          y >= gridYOffset &&
          y < gridYOffset + rows
        ) {
          continue;
        }

        const { x: posX, y: posY } = getPixelCoords(x, y, this.tileSize);
        const frameToUse = this.getRandomizedFrame(TILE_TYPES.GRASS);
        this.grassTiles[y] ??= [];

        const grass = this.scene.add
          .sprite(posX, posY, TILE_TYPES.GRASS.texture, frameToUse)
          .setScale(2)
          .setDepth(DEPTHS.GRASS);
        grass.flatFrame = frameToUse;
        this.grassTiles[y][x] = grass;
      }
    }
  }

  /**
   * Build the farmable dirt grid and its cross-shaped path.
   */
  createFarmGrid() {
    const { cols, rows, gridXOffset, gridYOffset } = this.layout;

    for (let y = gridYOffset; y < rows + gridYOffset; y++) {
      this.grid[y] = [];

      for (let x = gridXOffset; x < cols + gridXOffset; x++) {
        const { x: posX, y: posY } = getPixelCoords(x, y, this.tileSize);
        const isMiddleCol = x === Math.floor(cols / 2 + gridXOffset);
        const isMiddleRow = y === Math.floor(rows / 2 + gridYOffset);
        const isPath = isMiddleCol || isMiddleRow;
        const tileType = isPath ? "PATH" : "DIRT";
        const visualConfig = isPath ? TILE_TYPES.PATH : TILE_TYPES.DIRT;

        this.grid[y][x] = new Tile(
          this.scene,
          posX,
          posY,
          tileType,
          visualConfig,
        );
      }
    }
  }

  /**
   * Pick the base frame for a tile type, including its optional flat variations.
   */
  getRandomizedFrame(visualConfig) {
    if (
      visualConfig.frames.variations &&
      visualConfig.variationChance &&
      Math.random() < visualConfig.variationChance
    ) {
      return Phaser.Utils.Array.GetRandom(visualConfig.frames.variations);
    }

    return visualConfig.frames.default;
  }

  /**
   * Advance all crops according to their tile's current watered state.
   */
  updateCrops(delta) {
    this.grid.forEach((row) => {
      row?.forEach((tile) => {
        tile.crop?.update(delta, tile.isWatered);
      });
    });
  }

  /**
   * Return the farm-grid tile at the given logical grid coordinate.
   */
  getTile(gridX, gridY) {
    return this.grid[gridY]?.[gridX] ?? null;
  }

  /**
   * Place a freestanding sprite at a logical grid coordinate.
   */
  placeDecoration(
    gridX,
    gridY,
    texture,
    frame,
    scale = 1,
    depth = DEPTHS.OBJECTS,
  ) {
    const { x, y } = getPixelCoords(gridX, gridY, this.tileSize);
    const sprite = this.scene.add
      .sprite(x, y, texture, frame)
      .setScale(scale)
      .setDepth(depth);
    this.decorations.push(sprite);
    return sprite;
  }

  /**
   * Recalculate every grass and tilled edge frame.
   */
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

  /**
   * Recalculate edge frames for a changed tile and its immediate neighbors.
   */
  refreshTerrainBitmasksAround(centerX, centerY) {
    for (const { dx, dy } of [{ dx: 0, dy: 0 }, ...BITMASK_NEIGHBORS]) {
      const x = centerX + dx;
      const y = centerY + dy;

      this.refreshGrassBitmaskAt(x, y);

      const tile = this.getTile(x, y);
      if (tile?.isTilled) {
        this.refreshTilledBitmaskAt(x, y);
      }
    }
  }

  /**
   * Update one grass tile, preserving its randomized flat frame when fully surrounded.
   */
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

  /**
   * Update one tilled tile's edge frame, including its watered texture variant.
   */
  refreshTilledBitmaskAt(x, y) {
    const tile = this.getTile(x, y);
    if (!tile?.isTilled) return;

    const mask = this.getCardinalGatedBitmask(x, y, (neighborX, neighborY) =>
      Boolean(this.getTile(neighborX, neighborY)?.isTilled),
    );
    const frame =
      TILLED_BITMASK_TABLE[mask] ?? TILE_TYPES.TILLED.frames.default;

    if (tile.isWatered) {
      tile.setTerrainFrame(this.getWateredTilledTextureKey(frame));
      return;
    }

    tile.setTerrainFrame(TILE_TYPES.TILLED.texture, frame);
  }

  /**
   * Get or create a watered copy of a tilled frame without tinting exposed dirt pixels.
   */
  getWateredTilledTextureKey(frame) {
    const key = `tilled-watered-${frame}`;
    if (this.scene.textures.exists(key)) return key;

    const sourceFrame = this.scene.textures.getFrame(
      TILE_TYPES.TILLED.texture,
      frame,
    );
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
      if (
        !this.isTilledSoilPixel(data[i], data[i + 1], data[i + 2], data[i + 3])
      ) {
        continue;
      }

      data[i] = Math.floor(data[i] * 0.7);
      data[i + 1] = Math.floor(data[i + 1] * 0.75);
      data[i + 2] = Math.floor(data[i + 2] * 0.85);
    }
    context.putImageData(imageData, 0, 0);

    const texture = this.scene.textures.addCanvas(key, canvas);
    texture.refresh();

    return key;
  }

  /**
   * Identify pixels that belong to tilled soil rather than exposed dirt.
   */
  isTilledSoilPixel(red, green, blue, alpha) {
    if (alpha === 0) return false;
    return red < 160 && red > green && green >= blue;
  }

  /**
   * Compute an 8-way bitmask where diagonal corners require both adjacent sides.
   */
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

  /**
   * Treat anything outside the farm grid as grass for grass edge calculations.
   */
  isGrassLike(x, y) {
    return !this.grid[y]?.[x];
  }
}
