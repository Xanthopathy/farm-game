// src/entities/Player.js
import * as Phaser from "phaser";
import { DEPTHS, TOOLS } from "../constants";
import { getPixelCoords } from "../utils/GridMath";

export class Player extends Phaser.GameObjects.Sprite {
  constructor(scene, gridX, gridY, tileSize) {
    // Calculate pixel position from grid coordinates
    const { x, y } = getPixelCoords(gridX, gridY, tileSize);
    super(scene, x, y, "player");

    this.scene = scene;
    scene.add.existing(this);

    this.tileSize = tileSize;
    this.gridX = gridX;
    this.gridY = gridY;

    this.setScale(1.5);
    this.setOrigin(0.5, 0.75);
    this.setDepth(DEPTHS.PLAYER);
    this.speed = 180;

    this.cursors = scene.input.keyboard.addKeys({
      up: "W",
      left: "A",
      down: "S",
      right: "D",
    });

    this.toolKeys = scene.input.keyboard.addKeys({
      none: "ZERO",
      hoe: "ONE",
      bucket: "TWO",
      seeds: "THREE",
      scythe: "FOUR",
    });

    this.currentTool = TOOLS.NONE;
    this.isBusy = false; // Action delay
  }

  update(delta) {
    this.handleMovement(delta);
    this.handleToolSelection();
  }

  performAction(duration, callback) {
    this.isBusy = true;
    this.scene.time.delayedCall(duration, () => {
      this.isBusy = false;
      callback();
    });
  }

  handleMovement(delta) {
    const moveDistance = this.speed * (delta / 1000); // Use delta for smooth movement
    let moveX = 0;
    let moveY = 0;

    // WASD
    if (this.cursors.left.isDown) moveX -= 1;
    else if (this.cursors.right.isDown) moveX += 1;

    if (this.cursors.up.isDown) moveY -= 1;
    else if (this.cursors.down.isDown) moveY += 1;

    // Normalize diagonal movement (prevents moving faster diagonally)
    if (moveX !== 0 && moveY !== 0) {
      moveX *= Math.SQRT1_2;
      moveY *= Math.SQRT1_2;
    }

    this.x += moveX * moveDistance;
    this.y += moveY * moveDistance;
  }

  handleToolSelection() {
    // JustDown = once per press
    const JustDown = Phaser.Input.Keyboard.JustDown;
    if (JustDown(this.toolKeys.none)) {
      this.currentTool = TOOLS.NONE;
      console.log("Unequipped tool");
    } else if (JustDown(this.toolKeys.hoe)) {
      this.currentTool = TOOLS.HOE;
      console.log("Equipped: Hoe");
    } else if (JustDown(this.toolKeys.bucket)) {
      this.currentTool = TOOLS.BUCKET;
      console.log("Equipped: Bucket");
    } else if (JustDown(this.toolKeys.seeds)) {
      this.currentTool = TOOLS.SEEDS;
      console.log("Equipped: Seeds");
    } else if (JustDown(this.toolKeys.scythe)) {
      this.currentTool = TOOLS.SCYTHE;
      console.log("Equipped: Scythe");
    }
  }
}
