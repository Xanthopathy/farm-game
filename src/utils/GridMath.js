// src/utils/GridMath.js
/**
 * Phaser object positions are pixels; farm interactions use logical tile coords.
 */
export const getGridCoords = (x, y, tileSize) => {
  return {
    gridX: Math.floor(x / tileSize),
    gridY: Math.floor(y / tileSize),
  };
};

/**
 * Sprites are placed at tile centers rather than top-left corners.
 */
export const getPixelCoords = (gridX, gridY, tileSize) => {
  return {
    x: gridX * tileSize + tileSize / 2,
    y: gridY * tileSize + tileSize / 2,
  };
};
