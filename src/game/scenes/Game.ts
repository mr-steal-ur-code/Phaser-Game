import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  gameText: Phaser.GameObjects.Text;
  character: Phaser.GameObjects.Sprite;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  aKey: Phaser.Input.Keyboard.Key;
  dKey: Phaser.Input.Keyboard.Key;
  speed: number;
  bullets: Phaser.Physics.Arcade.Group;
  barrels: Phaser.Physics.Arcade.Group;
  barrelSpeed: number = 300;
  bulletSpeed: number;
  fireRate: number;
  lastFired: number;

  constructor() {
    super('Game');
    this.speed = 800; // Character movement speed
    this.bulletSpeed = 1000; // Bullet movement speed
    this.fireRate = 1200; // Fire rate in milliseconds
    this.lastFired = 0;
  }

  create() {
    // Set up camera and background
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor("#c6c6c6");

    this.background = this.add.image(500, 1420, 'background');
    this.background.setAlpha(0.5);

    this.gameText = this.add.text(500, 50, 'Check this out', {
      fontFamily: 'Arial Black',
      fontSize: 54,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5).setDepth(100);

    // Create the character
    this.character = this.add.sprite(500, 1650, 'character');
    this.character.setScale(2.0);

    // Set up keys
    this.aKey = this.input.keyboard!.addKey('A');
    this.dKey = this.input.keyboard!.addKey('D');

    // Create the bullet group
    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 50, // Max bullets allowed
    });

    // Automatically fire bullets at the specified fire rate
    this.time.addEvent({
      delay: this.fireRate,
      callback: this.fireBullet,
      callbackScope: this,
      loop: true,
    });

    this.time.addEvent({
      delay: 5000,
      callback: this.generateBarrels,
      callbackScope: this,
      loop: true,
    });

    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: Infinity, // Max bullets allowed
    });

    this.barrels = this.physics.add.group({
      defaultKey: "barrel",
      maxSize: Infinity,
    });

    this.generateBarrels()

    EventBus.emit('current-scene-ready', this);
  }

  update(time: number, delta: number) {
    const velocity = this.speed * (delta / 1000); // Calculate velocity based on delta time

    // Reset character position
    let dx = 0;

    // Check key presses and adjust character movement
    if (this.aKey.isDown) {
      dx -= velocity;
    }
    if (this.dKey.isDown) {
      dx += velocity;
    }

    // Move the character
    this.character.x += dx;

    // Clamp the character within the bounds of the game
    this.character.x = Phaser.Math.Clamp(this.character.x, 0, this.camera.width);
    this.character.y = Phaser.Math.Clamp(this.character.y, 0, this.camera.height);

  }

  generateBarrels() {
    const positions = [
      { x: window.innerWidth / 3, y: 0 },
      { x: window.innerWidth, y: 0 }
    ];

    positions.forEach((pos) => this.createBarrel(pos.x, pos.y));
  }

  createBarrel(x: number, y: number) {
    const barrel = this.barrels.get(x, y);
    if (barrel) {
      barrel
        .setActive(true)
        .setVisible(true)
        .setScale(8, 3); // Scale barrel to desired size

      this.physics.velocityFromAngle(90, this.barrelSpeed, barrel.body.velocity);

      barrel.body.onWorldBounds = true;
      barrel.body.world.on(
        'worldbounds',
        (body: { gameObject: Phaser.Physics.Arcade.Sprite }) => {
          if (body.gameObject === barrel) {
            barrel.setActive(false).setVisible(false);
          }
        }
      );
    }
  }

  fireBullet() {
    const bullet = this.bullets.get(this.character.x, this.character.y - this.character.height);
    if (bullet) {
      bullet.setActive(true).setVisible(true);
      this.physics.velocityFromAngle(-90, this.bulletSpeed, bullet.body.velocity);

      bullet.body.onWorldBounds = true;
      bullet.body.world.on('worldbounds', (body: { gameObject: Phaser.Physics.Arcade.Sprite; }) => {
        if (body.gameObject === bullet) {
          bullet.setActive(false).setVisible(false);
        }
      });
    }
  }

  changeScene() {
    this.scene.start('GameOver');
  }
}
