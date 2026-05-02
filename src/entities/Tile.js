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

  squishFX() {
    // Add a little "squish" effect
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 2.2,
      duration: 50,
      yoyo: true,
    });
  }

  till() {
    if (this.type === "DIRT" && !this.isTilled) {
      this.isTilled = true;
      this.sprite.setTexture(
        TILE_TYPES.TILLED.texture,
        TILE_TYPES.TILLED.frame,
      );

      this.squishFX();

      console.log("Tile tilled!");
      return true;
    }
    return false;
  }

  water() {
    if (this.isTilled && !this.isWatered) {
      this.isWatered = true;
      this.sprite.setTint(0x999999); // Darker tint for watered soil
    }

    this.squishFX();
  }

  plant(cropType) {
    if (this.isTilled && !this.crop) {
      this.crop = new Crop(this.scene, this.x, this.y, cropType);
      this.squishFX();
      return true;
    }
    return false;
  }

  harvest() {
    if (this.crop && this.crop.isMature) {
      const cropName = this.crop.type.name;
      const sellValue = this.crop.type.sellValue;

      // Destroy crop sprites
      this.crop.sprites.bottom.destroy();
      if (this.crop.sprites.top) {
        this.crop.sprites.top.destroy();
      }
      this.crop = null;

      // Reset tile state (back to tilled)
      this.isWatered = false;
      this.sprite.clearTint();

      this.squishFX();

      console.log(`Harvested ${cropName}!`);
      return { cropName, sellValue };
    }
    return null;
  }
}
