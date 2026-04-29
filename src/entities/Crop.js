// src/entities/Crop.js
import * as Phaser from "phaser";
import { DEPTHS } from "../constants";

export class Crop extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, type) {
    const frame =
      typeof type.frames[0] === "number"
        ? type.frames[0]
        : type.frames[0].bottom;
    super(scene, x, y, "objects", frame);
    this.scene = scene;
    this.type = type;
    this.growthStage = 0;
    this.isMature = false;
    this.timer = 0;
    this.topHalf = null;

    scene.add.existing(this);
    this.setScale(2);
    this.setDepth(DEPTHS.CROP_BOTTOM);
  }

  update(delta, isWatered) {
    if (this.isMature) return;

    // Only grow if the tile underneath is watered
    if (isWatered) {
      this.timer += delta;

      if (this.timer >= this.type.growthTime) {
        this.advanceStage();
        this.timer = 0;
      }
    }
  }

  advanceStage() {
    this.growthStage++;
    const nextFrame = this.type.frames[this.growthStage];

    if (nextFrame != undefined) {
      if (typeof nextFrame === "number") {
        // Single frame stage
        this.setFrame(nextFrame);
        if (this.topHalf) {
          this.topHalf.destroy();
          this.topHalf = null;
        }
      } else {
        // Composite frame stage (bottom + top)
        this.setFrame(nextFrame.bottom);

        if (!this.topHalf) {
          this.topHalf = this.scene.add.sprite(
            this.x,
            this.y - 32, // Offset by one tile (16px * 2 scale)
            "objects",
            nextFrame.top,
          );
          this.topHalf.setScale(2);
          this.topHalf.setDepth(DEPTHS.CROP_TOP);
        } else {
          this.topHalf.setFrame(nextFrame.top);
        }
      }
    }

    if (this.growthStage >= this.type.frames.length - 1) {
      this.isMature = true;
    }
  }
}
