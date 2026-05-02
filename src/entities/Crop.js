// src/entities/Crop.js
import { DEPTHS, CROP_TYPES } from "../constants";
import { createDynamicStack } from "../utils/SpriteUtils";

export class Crop {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = type;
    this.growthStage = 0;
    this.isMature = false;
    this.timer = 0;

    // Create dynamic stack for bottom/top sprite management
    this.sprites = createDynamicStack(
      scene,
      x,
      y,
      "objects",
      DEPTHS.CROP_BOTTOM,
      DEPTHS.CROP_TOP,
    );

    // Initialize with first frame
    const frame =
      typeof type.frames[0] === "number"
        ? type.frames[0]
        : type.frames[0].bottom;
    this.sprites.updateFrames(frame);
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
        this.sprites.updateFrames(nextFrame, null);
      } else {
        // Composite frame stage
        this.sprites.updateFrames(nextFrame.bottom, nextFrame.top);
      }
    }

    if (this.growthStage >= this.type.frames.length - 1) {
      this.isMature = true;
    }
  }
}
