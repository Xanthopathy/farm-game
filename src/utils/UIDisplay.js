// src/utils/UIDisplay.js
import { CROP_TYPES, TOOLS } from "../constants";

const TOP_RIGHT_MARGIN = 10;

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
      .setScrollFactor(0)
      .setDepth(1000);

    this.toolIcon = scene.add
      .sprite(170, 70, "tiny_town", 0)
      .setScale(2)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(1000);

    this.messageText = this.scene.add
      .text(scene.scale.width - TOP_RIGHT_MARGIN, TOP_RIGHT_MARGIN, "", {
        fontSize: "16px",
        color: "#ffff88",
        backgroundColor: "#000000aa",
        padding: { x: 5, y: 5 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);

    this.messageTimer = null;
  }

  update(player, game, debugDisplay = null) {
    const toolName =
      player.currentTool === TOOLS.SEEDS
        ? `Seeds: ${CROP_TYPES[game.selectedCropKey].name}`
        : player.currentTool.label;
    const goldCount = game.gold;
    const waterCount = game.water;
    const inventoryCount = game.inventory.length;
    const shippedToday = game.todayShippedValue;
    const dayInfo = game.gameOver
      ? `GAME OVER - Day: ${game.day}\nFailed quota: ${game.quota}g`
      : `Day: ${game.day} | Time: ${Math.ceil((game.dayTime - game.dayTimer) / 1000)}s\nQuota: ${game.quota}g`;

    this.uiText.setText(
      `${dayInfo} | Gold: ${goldCount}g\nShipped Today: ${shippedToday}g\nWater: ${waterCount}/${game.maxWater}\nTool: ${toolName}\nHarvested: ${inventoryCount}`,
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

    this.positionMessage(debugDisplay);
  }

  /**
   * @param {number} duration Milliseconds to show the message, or Infinity to pin it.
   */
  showMessage(message, duration = 1500) {
    this.messageText.setText(message);
    this.messageText.setVisible(true);

    if (this.messageTimer) {
      this.messageTimer.remove();
      this.messageTimer = null;
    }

    if (duration === Infinity) return;

    this.messageTimer = this.scene.time.delayedCall(duration, () => {
      this.messageText.setText("");
      this.messageText.setVisible(false);
      this.messageTimer = null;
    });
  }

  positionMessage(debugDisplay) {
    const stackY = debugDisplay?.getTopRightStackBottom() ?? TOP_RIGHT_MARGIN;

    this.messageText.setPosition(
      this.scene.scale.width - TOP_RIGHT_MARGIN,
      stackY,
    );
  }
}
