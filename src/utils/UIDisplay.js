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
      .sprite(150, 50, "tiny_town", 0)
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
    const dayInfo = `Day: ${game.day} | Time: ${Math.ceil((game.dayTime - game.dayTimer) / 1000)}s`;

    this.uiText.setText(
      `${dayInfo}\nTool: ${toolName}\nGold: ${goldCount}\nWater: ${waterCount}/${game.maxWater}\nHarvest: ${inventoryCount}`,
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
