import { AnimationManager } from "../../controllers/animationManager";
import { BossManager } from "../../controllers/bossManager";
import { InputManager } from "../../controllers/inputManager";
import { SoundManager } from "../../controllers/soundManager";
import { CST } from "../CST";
import { EventBus } from "../EventBus";


export class Boss extends Phaser.Scene {
  private backgroundBar: Phaser.GameObjects.Graphics;
  private healthBar: Phaser.GameObjects.Graphics;
  camera: Phaser.Cameras.Scene2D.Camera;
  webCollider: Phaser.Physics.Arcade.Collider | null;
  isGameOver: boolean = false;
  bulletSpeed: number;
  fireRate: number;
  gunCount: number;
  character: Phaser.Physics.Arcade.Sprite;
  boss: Phaser.Physics.Arcade.Sprite;
  bossManager: BossManager;
  bullets: Phaser.Physics.Arcade.Group;
  webShots: Phaser.Physics.Arcade.Group;
  totalEnemiesKilled: number;
  score: number;
  inputManager: InputManager;
  fireRateEvent: Phaser.Time.TimerEvent;
  level: number;

  constructor() {
    super(CST.SCENES.BOSS)
  }

  create(data: {
    bulletSpeed: number, fireRate: number, gunCount: number, totalEnemiesKilled: number, level: number;
    score: number
  }) {
    this.camera = this.cameras.main;
    this.bulletSpeed = data?.bulletSpeed || 1000;
    this.fireRate = data?.fireRate || 1000;
    this.gunCount = data?.gunCount || 1;
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
      maxSize: Infinity,
    });

    this.backgroundBar = this.add.graphics().fillStyle(0xff0000, 1).fillRect(0, 20, this.cameras.main.width, 20);

    this.healthBar = this.add.graphics().fillStyle(0x00ff00, 1).fillRect(0, 20, this.cameras.main.width, 20);

    this.bossManager = new BossManager(this.webShots)
    this.bossManager.spawnBoss(this, this.cameras.main.width, this.level);

    const boss = this.bossManager.getBoss();
    if (boss) {
      this.physics.add.collider(boss, this.bullets, this.onBossShoot as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    }

    this.webCollider = this.physics.add.collider(this.webShots, this.character, this.onWebHit, undefined, this);

    this.inputManager = new InputManager(this);


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

    AnimationManager.explodeAnimation(this);

    EventBus.emit('current-scene-ready', this);
  }

  update(time: number, delta: number) {
    if (this.isGameOver) {
      return;
    }

    // Update Boss Health Bar when hp data changes
    if (this.bossManager) {
      const currentHp = this.bossManager.getBossHp();
      const maxHp = this.bossManager.getBossMaxHp();

      const healthPercentage = Phaser.Math.Clamp(currentHp / maxHp, 0, 1);
      this.healthBar.clear();
      this.healthBar.fillStyle(0x00ff00, 1);
      this.healthBar.fillRect(0, 20, this.cameras.main.width * healthPercentage, 20);
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
    this.bossManager.bossWin();
    this.endGame();
    console.log('A web hit the character!',);
  }

  onBossShoot(_boss: Phaser.GameObjects.GameObject, bullet: Phaser.GameObjects.GameObject,) {
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
    const bossHp = this.bossManager.getBossHp();

    bulletSprite.setActive(false).setVisible(false);
    this.bossManager.setBossHp(1);

    if (bossHp <= 0) {
      if (this.fireRateEvent) {
        this.fireRateEvent.destroy();
      }
      this.bossManager.bossDeath(this);
      this.time.delayedCall(5000, () => this.nextLevel());
    }
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

    if (this.webCollider)
      this.physics.world.removeCollider(this.webCollider);
    this.webCollider = null;
    if (this.fireRateEvent) {
      this.fireRateEvent.destroy();
    }

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