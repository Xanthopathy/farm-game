// src/utils/UIDisplay.js
import { TOOLS } from "../constants";

export class UIDisplay {
  constructor(scene) {
    this.scene = scene;

    this.uiText = scene.add
      .text(10, 10, "", {
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#000000aa",
        padding: { x: 5, y: 5 },
      })
      .setOrigin(0, 0)
      .setScrollFactor(0) // Ensures it stays fixed to the screen
      .setDepth(1000);

    this.toolIcon = scene.add
      .sprite(170, 50, "tiny_town", 0)
      .setScale(2)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(1000);
  }

  update(player, game) {
    const toolName = player.currentTool.label;
    const goldCount = game.gold;
    const waterCount = game.water;
    const inventoryCount = game.inventory.length;
    const dayInfo = game.gameOver
      ? `GAME OVER - Day: ${game.day}\nFailed quota: ${game.quota}g`
      : `Day: ${game.day} | Time: ${Math.ceil((game.dayTime - game.dayTimer) / 1000)}s\nQuota: ${game.quota}g`;

    this.uiText.setText(
      `${dayInfo} | Gold: ${goldCount}g\nWater: ${waterCount}/${game.maxWater}\nTool: ${toolName}\nHarvested: ${inventoryCount}`,
    );

    if (player.currentTool.texture) {
      let frame = player.currentTool.frames.default;
      if (player.currentTool === TOOLS.BUCKET && game.water === 0) {
        frame = player.currentTool.frames.empty;
      }
      this.toolIcon.setTexture(player.currentTool.texture, frame);
      this.toolIcon.setVisible(true);
    } else {
      this.toolIcon.setVisible(false);
    }
  }
}
