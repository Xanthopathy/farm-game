// src/entities/Tile.js
import * as Phaser from "phaser";
import { Crop } from "./Crop";
import { DEPTHS, TILE_TYPES } from "../constants";

export class Tile {
  constructor(scene, x, y, type, visualConfig) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = type; // "DIRT", "PATH", etc.
    this.isTilled = false;
    this.isWatered = false;
    this.crop = null;

    // For PATH tiles, add a dirt background layer
    if (type === "PATH") {
      scene.add
        .sprite(x, y, TILE_TYPES.DIRT.texture, TILE_TYPES.DIRT.frames.default)
        .setScale(2)
        .setDepth(DEPTHS.TILE - 0.5); // Just below the PATH tile
    }

    // Select frame: use variation with chance, otherwise default
    let frameToUse = visualConfig.frames.default;
    if (
      visualConfig.frames.variations &&
      visualConfig.variationChance &&
      Math.random() < visualConfig.variationChance
    ) {
      frameToUse = Phaser.Utils.Array.GetRandom(
        visualConfig.frames.variations,
      );
    }

    // Create the visual representation
    this.sprite = scene.add
      .sprite(x, y, visualConfig.texture, frameToUse)
      .setScale(2)
      .setDepth(DEPTHS.TILE);
  }

  setTerrainFrame(texture, frame) {
    this.sprite.setTexture(texture, frame);
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
        TILE_TYPES.TILLED.frames.default,
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

      this.squishFX();

      console.log(`Harvested ${cropName}!`);
      return { cropName, sellValue };
    }
    return null;
  }
}
