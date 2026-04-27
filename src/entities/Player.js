// src/entities/Player.js
import * as Phaser from "phaser";

export class Player extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "player");
    scene.add.existing(this);

    // We can also set the 'origin' to 0.5 to keep our math consistent
    this.setOrigin(0.5);

    this.speed = 200;
    this.cursors = scene.input.keyboard.addKeys("W,A,S,D");
  }

  update(delta) {
    // Movement Logic
    // We reset velocity every frame, then check if keys are down
    const moveDistance = this.speed * (delta / 1000); // Use delta for smooth movement

    // WASD
    if (this.cursors.A.isDown) this.x -= moveDistance;
    else if (this.cursors.D.isDown) this.x += moveDistance;
    if (this.cursors.W.isDown) this.y -= moveDistance;
    else if (this.cursors.S.isDown) this.y += moveDistance;
    // Note: Normalize diagonal movement
  }
}
