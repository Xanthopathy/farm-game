// src/utils/GridMath.js
export const getGridCoords = (x, y, tileSize, offsetX, offsetY) => {
  // We add half a tileSize because tiles are positioned by their centers.
  // This ensures the grid index boundaries align with the visual tile edges.
  const relativeX = x - offsetX + tileSize / 2;
  const relativeY = y - offsetY + tileSize / 2;

  return {
    gridX: Math.floor(relativeX / tileSize),
    gridY: Math.floor(relativeY / tileSize),
  };
};
