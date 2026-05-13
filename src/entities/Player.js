// src/entities/Player.js
import * as Phaser from "phaser";
import { DEPTHS, TOOLS } from "../constants";
import { getPixelCoords } from "../utils/GridMath";

export class Player extends Phaser.GameObjects.Sprite {
  constructor(scene, gridX, gridY, tileSize) {
    // Calculate pixel position from grid coordinates
    const { x, y } = getPixelCoords(gridX, gridY, tileSize);
    super(scene, x, y, "player_idle", 0);

    this.scene = scene;
    scene.add.existing(this);
    this.createAnimations();
    this.facing = "down";

    this.tileSize = tileSize;
    this.gridX = gridX;
    this.gridY = gridY;

    this.setScale(2);
    this.setOrigin(0.5, 0.75);
    this.setDepth(DEPTHS.PLAYER);
    this.speed = 120;

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

    this.toolOrder = [
      TOOLS.NONE,
      TOOLS.HOE,
      TOOLS.BUCKET,
      TOOLS.SEEDS,
      TOOLS.SCYTHE,
    ];
    this.selectedToolIndex = 0;
    this.currentTool = this.toolOrder[this.selectedToolIndex];
    this.isBusy = false; // Action delay

    // Visual indicator for tools during action
    this.toolVisual = scene.add.sprite(
      this.x,
      this.y,
      TOOLS.HOE.texture,
      TOOLS.HOE.frames.default,
    );
    this.toolVisual.setScale(1.5);
    this.toolVisual.setDepth(DEPTHS.PLAYER + 1);
    this.toolVisual.setVisible(false);
    this.toolVisual.setOrigin(0.5, 1); // Set origin to bottom for a "swing" effect
  }

  createAnimations() {
    const anims = this.scene.anims;
    if (anims.exists("idle-down")) return;

    const configs = [
      { key: "idle-down", sheet: "player_idle", start: 0, end: 3, repeat: -1 },
      { key: "idle-up", sheet: "player_idle", start: 4, end: 7, repeat: -1 },
      {
        key: "idle-right",
        sheet: "player_idle",
        start: 8,
        end: 11,
        repeat: -1,
      },
      { key: "walk-down", sheet: "player_walk", start: 0, end: 5, repeat: -1 },
      { key: "walk-up", sheet: "player_walk", start: 6, end: 11, repeat: -1 },
      {
        key: "walk-right",
        sheet: "player_walk",
        start: 12,
        end: 17,
        repeat: -1,
      },
    ];

    configs.forEach((cfg) => {
      anims.create({
        key: cfg.key,
        frames: anims.generateFrameNumbers(cfg.sheet, {
          start: cfg.start,
          end: cfg.end,
        }),
        frameRate: cfg.sheet === "player_idle" ? 4 : 12,
        repeat: cfg.repeat,
      });
    });
  }

  update(delta) {
    this.handleMovement(delta);
    this.handleToolSelection();
  }

  performAction(duration, callback, frame = this.currentTool.frames.default) {
    const tool = this.currentTool;
    if (!tool.texture) {
      // If no tool is equipped, we still want the delay/callback but no visual
      this.isBusy = true;
      this.scene.time.delayedCall(duration, () => {
        this.isBusy = false;
        callback();
      });
      return;
    }

    this.isBusy = true;
    const isLeft = this.facing === "left";

    // Position and show the tool
    let ox = 0,
      oy = 0;
    if (this.facing === "right") ox = 12;
    else if (isLeft) ox = -12;
    else if (this.facing === "up") oy = -8;
    else oy = 8;

    this.toolVisual.setTexture(tool.texture, frame);
    this.toolVisual.setPosition(this.x + ox, this.y + oy);
    this.toolVisual.setFlipX(isLeft);
    this.toolVisual.setVisible(true);

    const startAngle = isLeft ? 45 : -45;
    const endAngle = isLeft ? -45 : 45;
    this.toolVisual.setAngle(startAngle);
    // Swing animation
    this.scene.tweens.add({
      targets: this.toolVisual,
      angle: endAngle,
      duration: duration,
      ease: "Cubic.out",
    });

    this.scene.time.delayedCall(duration, () => {
      this.isBusy = false;
      this.toolVisual.setVisible(false);
      callback();
    });
  }

  handleMovement(delta) {
    if (this.isBusy) return;

    const moveDistance = this.speed * (delta / 1000); // Use delta for smooth movement
    let moveX = 0;
    let moveY = 0;

    if (this.cursors.left.isDown) {
      moveX = -1;
      this.facing = "left";
    } else if (this.cursors.right.isDown) {
      moveX = 1;
      this.facing = "right";
    }

    if (this.cursors.up.isDown) {
      moveY = -1;
      if (moveX === 0) this.facing = "up";
    } else if (this.cursors.down.isDown) {
      moveY = 1;
      if (moveX === 0) this.facing = "down";
    }

    // Normalize diagonal movement (prevents moving faster diagonally)
    if (moveX !== 0 && moveY !== 0) {
      moveX *= Math.SQRT1_2;
      moveY *= Math.SQRT1_2;
    }

    // Animation Logic
    const animDir = this.facing === "left" ? "right" : this.facing;
    this.setFlipX(this.facing === "left");

    if (moveX !== 0 || moveY !== 0) {
      this.play(`walk-${animDir}`, true);
    } else {
      this.play(`idle-${animDir}`, true);
    }

    this.x += moveX * moveDistance;
    this.y += moveY * moveDistance;
  }

  handleToolSelection() {
    // JustDown = once per press
    const JustDown = Phaser.Input.Keyboard.JustDown;
    if (JustDown(this.toolKeys.none)) {
      this.selectToolByIndex(0);
    } else if (JustDown(this.toolKeys.hoe)) {
      this.selectToolByIndex(1);
    } else if (JustDown(this.toolKeys.bucket)) {
      this.selectToolByIndex(2);
    } else if (JustDown(this.toolKeys.seeds)) {
      this.selectToolByIndex(3);
    } else if (JustDown(this.toolKeys.scythe)) {
      this.selectToolByIndex(4);
    }
  }

  selectToolByIndex(index) {
    const clampedIndex = Phaser.Math.Wrap(index, 0, this.toolOrder.length);
    this.selectedToolIndex = clampedIndex;
    this.currentTool = this.toolOrder[this.selectedToolIndex];
    console.log(`Equipped: ${this.currentTool.label}`);
  }

  cycleTool(direction) {
    if (this.isBusy) return;
    this.selectToolByIndex(this.selectedToolIndex + direction);
  }
}
