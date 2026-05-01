// src/utils/Debug.js
import { getGridCoords } from "./GridMath";

export class DebugDisplay {
  constructor(scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics().setDepth(1000);
    this.debugText = scene.add
      .text(790, 10, "", {
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#000000aa",
        padding: { x: 5, y: 5 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0); // Ensures it stays fixed to the screen
  }

  update(player, tileSize, offsetX, offsetY, showGrid) {
    const { gridX, gridY } = getGridCoords(
      player.x,
      player.y,
      tileSize,
      offsetX,
      offsetY,
    );

    this.debugText.setText(
      `Pos: ${Math.floor(player.x)}, ${Math.floor(player.y)}\nGrid: ${gridX}, ${gridY}`,
    );

    this.graphics.clear();

    if (showGrid) {
      // Draw 32x32 global grid starting from 0,0
      this.graphics.lineStyle(1, 0x00ff00, 0.3); // Semi-transparent green

      const width = this.scene.scale.width;
      const height = this.scene.scale.height;

      for (let x = 0; x < width; x += 32) {
        this.graphics.lineBetween(x, 0, x, height - 1);
      }
      for (let y = 0; y < height; y += 32) {
        this.graphics.lineBetween(0, y, width - 1, y);
      }

      // Draw explicit borders at screen edges
      // NOTE: THIS SETUP ACCURATELY SHOWS BORDERS SO DON'T TOUCH
      this.graphics.lineStyle(1, 0x00ff00, 0.3);
      this.graphics.lineBetween(0, 0, width, 0); // Top
      this.graphics.lineBetween(width, 0, width, height); // Right
      this.graphics.lineBetween(0, height - 1, width, height - 1); // Bottom
      this.graphics.lineBetween(1, 0, 1, height); // Left

      // Draw dot and tile highlight based on the logical farming grid
      const dotX = gridX * tileSize + offsetX;
      const dotY = gridY * tileSize + offsetY;

      // Highlight the specific tile bounds in red
      this.graphics.lineStyle(1, 0xff0000, 1);
      this.graphics.strokeRect(
        dotX - tileSize / 2,
        dotY - tileSize / 2,
        tileSize,
        tileSize,
      );

      // Draw the center dot
      this.graphics.fillStyle(0xff0000, 1);
      this.graphics.fillRect(dotX, dotY, 2, 2);

      // Draw the exact pixel position of the player (the "Pos" value)
      this.graphics.fillStyle(0x00ffff, 1); // Cyan for high visibility
      this.graphics.fillRect(player.x, player.y, 1, 1);
    }
  }
}
