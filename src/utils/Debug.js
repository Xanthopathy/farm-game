// src/utils/Debug.js
import { getGridCoords, getPixelCoords } from "./GridMath";

const TOP_RIGHT_MARGIN = 10;
const STACK_GAP = 8;

export class DebugDisplay {
  constructor(scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics().setDepth(1000);
    this.debugText = scene.add
      .text(scene.scale.width - TOP_RIGHT_MARGIN, TOP_RIGHT_MARGIN, "", {
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#000000aa",
        padding: { x: 5, y: 5 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setVisible(false);
  }

  update(player, tileSize, showGrid, showText, targetX, targetY) {
    const { gridX, gridY } = getGridCoords(player.x, player.y, tileSize);

    const highlightX = targetX ?? gridX;
    const highlightY = targetY ?? gridY;

    this.graphics.clear();
    this.debugText.setVisible(showText);

    if (showText) {
      this.debugText.setText(
        `Pos: ${Math.floor(player.x)}, ${Math.floor(player.y)}\nGrid: ${gridX}, ${gridY}`,
      );
    }

    if (showGrid) {
      this.graphics.lineStyle(1, 0x00ff00, 0.3);

      const width = this.scene.scale.width;
      const height = this.scene.scale.height;

      for (let x = 0; x < width; x += 32) {
        this.graphics.lineBetween(x, 0, x, height - 1);
      }
      for (let y = 0; y < height; y += 32) {
        this.graphics.lineBetween(0, y, width - 1, y);
      }

      // NOTE: THIS SETUP ACCURATELY SHOWS BORDERS SO DON'T TOUCH
      this.graphics.lineStyle(1, 0x00ff00, 0.3);
      this.graphics.lineBetween(0, 0, width, 0);
      this.graphics.lineBetween(width, 0, width, height);
      this.graphics.lineBetween(0, height - 1, width, height - 1);
      this.graphics.lineBetween(1, 0, 1, height);

      const { x: dotX, y: dotY } = getPixelCoords(
        highlightX,
        highlightY,
        tileSize,
      );

      this.graphics.lineStyle(1, 0xff0000, 1);
      this.graphics.strokeRect(
        dotX - tileSize / 2,
        dotY - tileSize / 2,
        tileSize,
        tileSize,
      );

      this.graphics.fillStyle(0xff0000, 1);
      this.graphics.fillRect(dotX, dotY, 2, 2);

      this.graphics.fillStyle(0x00ffff, 1);
      this.graphics.fillRect(player.x, player.y, 1, 1);
    }
  }

  /**
   * Returns the y position where the next top-right HUD block should start.
   */
  getTopRightStackBottom() {
    if (!this.debugText.visible) {
      return TOP_RIGHT_MARGIN;
    }

    return this.debugText.y + this.debugText.height + STACK_GAP;
  }
}
