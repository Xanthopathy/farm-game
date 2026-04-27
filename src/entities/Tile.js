// src/entities/Tile.js
import * as Phaser from "phaser";

export class Tile {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.type = type; // "DIRT" or "PATH"
    this.isTilled = false;
    this.isWatered = false;
    this.crop = null;

    // Create the visual representation
    const texture = type === "DIRT" ? "dirt" : "path";
    this.sprite = scene.add.sprite(x, y, texture);

    // Add a faint grid outline
    scene.add.rectangle(x, y, 32, 32).setStrokeStyle(1, 0x333333);
  }

  till() {
    if (this.type === "DIRT" && !this.isTilled) {
      this.isTilled = true;
      this.sprite.setTexture("tilled");
      console.log("Tile tilled!");
      return true;
    }
    return false;
  }

  water() {
    if (this.isTilled && !this.isWatered) {
      this.isWatered = true;
      this.sprite.setTint(0x73b9d0); // Blueish tint for wet soil
    }
  }
}
// src/entities/Tile.js
