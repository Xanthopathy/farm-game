// src/scenes/MainGame.js
import { Scene } from "phaser";

export class MainGame extends Scene {
  constructor() {
    super("MainGame"); // This name is how we switch between scenes later
  }

  init() {
    // Use this for defining variables
    this.playerSpeed = 200;
  }

  preload() {
    // We'll load images here tomorrow
  }

  create() {
    const tileSize = 32;
    const cols = 21;
    const rows = 13;
    const offsetX = 80;
    const offsetY = 180; // Leaving for UI

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        // Position = index * size + offset (to center it a bit)
        const posX = x * tileSize + offsetX;
        const posY = y * tileSize + offsetY;

        // Draw the "Outline" for the whole screen area
        // .setStrokeStyle(thickness, color) makes it an empty box
        this.add
          .rectangle(posX, posY, tileSize, tileSize)
          .setStrokeStyle(1, 0x333333);

        // Logic for the "Plus" Path
        // We find the middle column and middle row
        const isMiddleCol = x === Math.floor(cols / 2);
        const isMiddleRow = y === Math.floor(rows / 2);

        // Only draw dirt if it's NOT part of the middle path
        if (!isMiddleCol && !isMiddleRow) {
          this.add.rectangle(posX, posY, tileSize - 4, tileSize - 4, 0x714e2c);
        } else {
          this.add.rectangle(posX, posY, tileSize - 4, tileSize - 4, 0xfff8dc);
        }
      }
    }

    // The Player (A simple green rectangle for now) (rendered after the grid to stay on top)
    // Syntax: this.add.rectangle(x, y, width, height, color)
    this.player = this.add.rectangle(400, 140, 32, 32, 0x00ff00);
    // The Input (Telling Phaser to listen for WASD)
    this.cursors = this.input.keyboard.addKeys("W,A,S,D");
  }

  update() {
    // Movement Logic
    // We reset velocity every frame, then check if keys are down
    const { W, A, S, D } = this.cursors;

    if (A.isDown) {
      this.player.x -= this.playerSpeed * (1 / 60); // Movement based on 60fps
    } else if (D.isDown) {
      this.player.x += this.playerSpeed * (1 / 60);
    }

    if (W.isDown) {
      this.player.y -= this.playerSpeed * (1 / 60);
    } else if (S.isDown) {
      this.player.y += this.playerSpeed * (1 / 60);
    }
  }
}
