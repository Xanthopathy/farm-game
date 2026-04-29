// src/entities/Tile.js
import * as Phaser from "phaser";
import { Crop } from "./Crop";
import { DEPTHS, TILE_TYPES } from "../constants";

export class Tile {
  constructor(scene, x, y, type, visualConfig) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = type; // "DIRT" or "PATH"
    this.isTilled = false;
    this.isWatered = false;
    this.crop = null;

    // Create the visual representation
    this.sprite = scene.add
      .sprite(x, y, visualConfig.texture, visualConfig.frame)
      .setScale(2)
      .setDepth(DEPTHS.TILE);
  }

  till() {
    if (this.type === "DIRT" && !this.isTilled) {
      this.isTilled = true;
      this.sprite.setTexture(
        TILE_TYPES.TILLED.texture,
        TILE_TYPES.TILLED.frame,
      );
      console.log("Tile tilled!");
      return true;
    }
    return false;
  }

  water() {
    if (this.isTilled && !this.isWatered) {
      this.isWatered = true;
      this.sprite.setTint(0x999999); // Darker tint for watered soil

      // Add a little "squish" effect when watering
      this.scene.tweens.add({
        targets: this.sprite,
        scale: 2.2,
        duration: 50,
        yoyo: true,
      });
    }
  }

  plant(cropType) {
    if (this.isTilled && !this.crop) {
      this.crop = new Crop(this.scene, this.x, this.y, cropType);
      return true;
    }
    return false;
  }
}
