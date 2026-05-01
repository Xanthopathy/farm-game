// src/utils/GridMath.js
/**
 * Convert pixel coordinates to grid coordinates
 */
export const getGridCoords = (x, y, tileSize, offsetX, offsetY) => {
  const relativeX = x - offsetX;
  const relativeY = y - offsetY;

  return {
    gridX: Math.floor(relativeX / tileSize),
    gridY: Math.floor(relativeY / tileSize),
  };
};

/**
 * Convert grid coordinates to pixel coordinates (center of the tile)
 */
export const getPixelCoords = (gridX, gridY, tileSize, offsetX, offsetY) => {
  return {
    x: gridX * tileSize + offsetX + tileSize / 2,
    y: gridY * tileSize + offsetY + tileSize / 2,
  };
};
