// src/utils/GridMath.js
/**
 * Convert pixel coordinates to grid coordinates
 */
export const getGridCoords = (x, y, tileSize) => {
  return {
    gridX: Math.floor(x / tileSize),
    gridY: Math.floor(y / tileSize),
  };
};

/**
 * Convert grid coordinates to pixel coordinates (center of the tile)
 */
export const getPixelCoords = (gridX, gridY, tileSize) => {
  return {
    x: gridX * tileSize + tileSize / 2,
    y: gridY * tileSize + tileSize / 2,
  };
};
