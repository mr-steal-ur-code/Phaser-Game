import { AnimationManager } from "../../controllers/animationManager";
import { BossManager } from "../../controllers/bossManager";
import { InputManager } from "../../controllers/inputManager";
import { SoundManager } from "../../controllers/soundManager";
import { CST } from "../CST";
import { EventBus } from "../EventBus";


export class Boss extends Phaser.Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  isGameOver: boolean = false;
  bulletSpeed: number;
  fireRate: number;
  gunCount: number;
  character: Phaser.Physics.Arcade.Sprite;
  boss: Phaser.Physics.Arcade.Sprite;
  bullets: Phaser.Physics.Arcade.Group;
  webShots: Phaser.Physics.Arcade.Group;
  totalEnemiesKilled: number;
  score: number;
  inputManager: InputManager;
  fireRateEvent: Phaser.Time.TimerEvent;
  webShotCollider: Phaser.Physics.Arcade.Collider | null;
  level: number;

  constructor() {
    super(CST.SCENES.BOSS)
  }

  create(data: {
    bulletSpeed: number, fireRate: number, gunCount: number, totalEnemiesKilled: number, level: number;
    score: number
  }) {
    this.camera = this.cameras.main;
    this.bulletSpeed = data?.bulletSpeed || 500;
    this.fireRate = data?.fireRate || 500;
    this.gunCount = data?.gunCount || 2;
    this.totalEnemiesKilled = data?.totalEnemiesKilled || 0;
    this.score = data?.score || 0;
    this.level = data?.level || 5;

    this.character = this.physics.add.sprite(500, 1650, 'character');

    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: Infinity
    });

    this.webShots = this.physics.add.group({
      defaultKey: 'web_shot',
      maxSize: 10,
    });

    this.webShotCollider = this.physics.add.collider(this.webShots, this.character, this.onWebHit, undefined, this);

    this.inputManager = new InputManager(this);

    const bossManager = new BossManager(this.boss, this.webShots)
    bossManager.spawnBoss(this, this.cameras.main.width);

    this.time.addEvent({
      delay: 16,
      callback: () => { },
      loop: true,
    });

    this.fireRateEvent = this.time.addEvent({
      delay: this.fireRate,
      callback: this.fireBullet,
      callbackScope: this,
      loop: true,
    });

    EventBus.emit('current-scene-ready', this);
  }

  update(time: number, delta: number) {
    if (this.isGameOver) {
      return;
    }
    const velocity = 1000 * (delta / 1000);
    const smoothingFactor = 0.3;

    if (this.inputManager.getPointerDown()) {
      const targetX = this.inputManager.getPointerX();
      this.character.x += (targetX - this.character.x) * smoothingFactor;
    }

    // Reset character position
    let dx = 0;

    // Check key presses and adjust character movement
    if (this.inputManager.isKeyPressed("A")) {
      dx -= velocity;
    }
    if (this.inputManager.isKeyPressed('D')) {
      dx += velocity;
    }

    if (this.inputManager.getPointerDown()) {
      const screenMiddle = this.cameras.main.width / 2;
      if (this.inputManager.getPointerX() < screenMiddle) {
        dx -= velocity;
      } else {
        dx += velocity;
      }
    }
    // Move the character
    this.character.x += dx;
    // Clamp the character within the bounds of the game
    this.character.x = Phaser.Math.Clamp(this.character.x, 0, this.camera.width);
    this.character.y = Phaser.Math.Clamp(this.character.y, 0, this.camera.height);
  }

  fireBullet() {
    SoundManager.playShootSound(this);
    for (let i = 0; i < this.gunCount; i++) {
      const bullet = this.bullets.get(this.character.x + (i - Math.floor(this.gunCount / 2)) * 20, this.character.y);
      if (bullet) {
        bullet.setActive(true).setVisible(true);
        const angleOffset = (i - Math.floor(this.gunCount / 2)) * 3;
        this.physics.velocityFromAngle(-90 + angleOffset, this.bulletSpeed, bullet.body.velocity);
      }
    }
  }

  onWebHit() {
    SoundManager.playShootSound(this);
    if (this.webShotCollider)
      this.physics.world.removeCollider(this.webShotCollider);
    this.webShotCollider = null;
    this.nextLevel();
  }

  nextLevel() {
    this.sound.stopAll();
    this.scene.start(CST.SCENES.GAME, {
      bulletSpeed: this.bulletSpeed,
      fireRate: this.fireRate,
      gunCount: this.gunCount,
      totalEnemiesKilled: this.totalEnemiesKilled,
      score: this.score,
      level: this.level + 1
    });
  }

  endGame() {
    this.character.setVelocity(0, 0);
    this.isGameOver = true;

    this.bullets.getChildren().forEach((bullet: Phaser.GameObjects.GameObject) => {
      if (bullet instanceof Phaser.Physics.Arcade.Sprite) {
        bullet.setActive(false).setVisible(false).disableBody(true, true);
      }
    });
    this.webShots.getChildren().forEach((webShot: Phaser.GameObjects.GameObject) => {
      if (webShot instanceof Phaser.Physics.Arcade.Sprite) {
        webShot.setActive(false).setVisible(false).disableBody(true, true);
      }
    });
    AnimationManager.playExplosion(this, this.character.x, this.character.y, true);
    this.sound.stopByKey("main_game_music");
    SoundManager.playExplosionSound(this, 4)
    this.time.delayedCall(2500, () => {
      this.endScene();
    });
  }

  endScene() {
    this.sound.stopByKey("explode");
    this.scene.start(CST.SCENES.GAMEOVER, {
      score: this.score,
      enemiesKilled: this.totalEnemiesKilled
    });
  }
}