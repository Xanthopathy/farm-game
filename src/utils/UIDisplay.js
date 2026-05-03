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
  }

  update(player, game) {
    const toolName = this.getToolName(player.currentTool);
    const goldCount = game.gold;
    const waterCount = game.water;
    const inventoryCount = game.inventory.length;

    this.uiText.setText(
      `Tool: ${toolName}\nGold: ${goldCount}\nWater: ${waterCount}/${game.maxWater}\nHarvest: ${inventoryCount}`,
    );
  }

  getToolName(tool) {
    switch (tool) {
      case TOOLS.NONE:
        return "None";
      case TOOLS.HOE:
        return "Hoe";
      case TOOLS.BUCKET:
        return "Bucket";
      case TOOLS.SEEDS:
        return "Seeds";
      case TOOLS.SCYTHE:
        return "Scythe";
      default:
        return "Unknown";
    }
  }
}
