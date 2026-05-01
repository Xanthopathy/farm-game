// src/entities/Player.js
import * as Phaser from "phaser";
import { DEPTHS } from "../constants";
import { getPixelCoords } from "../utils/GridMath";

export class Player extends Phaser.GameObjects.Sprite {
  constructor(scene, gridX, gridY, tileSize) {
    // Calculate pixel position from grid coordinates
    const { x, y } = getPixelCoords(gridX, gridY, tileSize);

    super(scene, x, y, "player");

    this.scene = scene;
    this.tileSize = tileSize;

    // Store grid position
    this.gridX = gridX;
    this.gridY = gridY;

    this.setScale(1.5);
    scene.add.existing(this);

    // We can also set the 'origin' to 0.5 to keep our math consistent
    this.setOrigin(0.5, 0.75);
    this.setDepth(DEPTHS.PLAYER);

    this.speed = 150;
    this.cursors = scene.input.keyboard.addKeys("W,A,S,D");
  }

  update(delta) {
    // Movement Logic
    const moveDistance = this.speed * (delta / 1000); // Use delta for smooth movement
    let moveX = 0;
    let moveY = 0;

    // WASD
    if (this.cursors.A.isDown) moveX -= 1;
    else if (this.cursors.D.isDown) moveX += 1;

    if (this.cursors.W.isDown) moveY -= 1;
    else if (this.cursors.S.isDown) moveY += 1;

    // Normalize diagonal movement (prevents moving faster diagonally)
    if (moveX !== 0 && moveY !== 0) {
      moveX *= Math.SQRT1_2;
      moveY *= Math.SQRT1_2;
    }

    this.x += moveX * moveDistance;
    this.y += moveY * moveDistance;
  }
}
