// src/utils/GridMath.js
import { getGridCoords } from "./GridMath";

export class DebugDisplay {
  constructor(scene) {
    this.scene = scene;
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

  update(player, tileSize, offsetX, offsetY) {
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
  }
}
