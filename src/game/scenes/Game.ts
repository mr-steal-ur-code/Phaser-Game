import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  gameText: Phaser.GameObjects.Text;
  character: Phaser.GameObjects.Sprite;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  wKey: Phaser.Input.Keyboard.Key;
  aKey: Phaser.Input.Keyboard.Key;
  sKey: Phaser.Input.Keyboard.Key;
  dKey: Phaser.Input.Keyboard.Key;
  spaceKey: Phaser.Input.Keyboard.Key;
  speed: number;

  constructor() {
    super('Game');
    this.speed = 200; // Character movement speed
  }

  create() {
    // Set up camera and background
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x00ff00);

    this.background = this.add.image(512, 384, 'background');
    this.background.setAlpha(0.5);

    this.gameText = this.add.text(512, 50, 'Check this out', {
      fontFamily: 'Arial Black',
      fontSize: 38,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5).setDepth(100);

    // Create the character
    this.character = this.add.sprite(512, 384, 'character');
    this.character.setScale(1.0);

    // Set up keys
    this.wKey = this.input.keyboard!.addKey('W');
    this.aKey = this.input.keyboard!.addKey('A');
    this.sKey = this.input.keyboard!.addKey('S');
    this.dKey = this.input.keyboard!.addKey('D');
    this.spaceKey = this.input.keyboard!.addKey('space');

    EventBus.emit('current-scene-ready', this);
  }

  update(time: number, delta: number) {
    const velocity = this.speed * (delta / 1000); // Calculate velocity based on delta time

    // Reset character position
    let dx = 0;
    let dy = 0;

    // Check key presses and adjust character movement
    if (this.wKey.isDown) {
      dy -= velocity;
    }
    if (this.aKey.isDown) {
      dx -= velocity;
    }
    if (this.sKey.isDown) {
      dy += velocity;
    }
    if (this.dKey.isDown) {
      dx += velocity;
    }
    if (this.spaceKey.isDown) {
      console.log("space");

    }

    // Move the character
    this.character.x += dx;
    this.character.y += dy;

    // Optional: Clamp the character within the bounds of the game
    this.character.x = Phaser.Math.Clamp(this.character.x, 0, this.camera.width);
    this.character.y = Phaser.Math.Clamp(this.character.y, 0, this.camera.height);
  }

  changeScene() {
    this.scene.start('GameOver');
  }
}
