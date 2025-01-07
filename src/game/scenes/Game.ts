import { AnimationManager } from '../../controllers/animationManager';
import { BarrelManager } from '../../controllers/barrelManager';
import { EnemyManager } from '../../controllers/enemyManager';
import { InputManager } from '../../controllers/inputManager';
import { SoundManager } from '../../controllers/soundManager';
import { CST } from '../CST';
import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  inputManager: InputManager;
  barrelManager: BarrelManager;
  enemyManager: EnemyManager;
  background: Phaser.GameObjects.Image;
  scoreText: Phaser.GameObjects.Text;
  character: Phaser.Physics.Arcade.Sprite;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  speed: number;
  bullets: Phaser.Physics.Arcade.Group;
  barrels: Phaser.Physics.Arcade.Group;
  enemies: Phaser.Physics.Arcade.Group;
  barrelCollider: Phaser.Physics.Arcade.Collider | null;
  enemyCollider: Phaser.Physics.Arcade.Collider | null;
  barrelSpeed: number = 300;
  barrelHp: number;
  bulletSpeed: number;
  gunCount: number;
  fireRate: number;
  fireRateEvent: Phaser.Time.TimerEvent;
  enemySpawnEvent: Phaser.Time.TimerEvent;
  barrelSpawnEvent: Phaser.Time.TimerEvent;
  enemySize: number;
  difficulty: number;
  enemiesKilled: number;
  totalEnemiesKilled: number;
  score: number = 0;
  isGameOver: boolean = false;

  constructor() {
    super(CST.SCENES.GAME);
    this.speed = 1000;
  }

  create() {
    this.isGameOver = false;
    this.bulletSpeed = 1000;
    this.fireRate = 1000;
    this.gunCount = 1;
    this.enemySize = 2;
    this.difficulty = 1;
    this.enemiesKilled = 0;
    this.totalEnemiesKilled = 0;
    this.score = 0;
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor("#c6c6c6");

    this.background = this.add.image(500, 1420, 'background');
    this.background.setAlpha(0.5);

    SoundManager.playGameMusic(this)

    this.scoreText = this.add.text(250, 50, `Score: ${this.score}`, {
      fontFamily: 'Arial Black',
      fontSize: 54,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5).setDepth(100);

    // Create the character
    this.character = this.physics.add.sprite(500, 1650, 'character');

    this.inputManager = new InputManager(this);

    // Automatically fire bullets at the specified fire rate
    this.fireRateEvent = this.time.addEvent({
      delay: this.fireRate,
      callback: this.fireBullet,
      callbackScope: this,
      loop: true,
    });

    this.enemySpawnEvent = this.time.addEvent({
      delay: 5000,
      callback: () => this.enemyManager.spawnEnemies(this, this.camera.width, this.fireRate, this.gunCount, this.enemySize),
      callbackScope: this,
      loop: true,
    })

    this.barrelSpawnEvent = this.time.addEvent({
      delay: 10000,
      callback: () => this.barrelManager.generateBarrels(this, this.fireRate, this.bulletSpeed, this.difficulty),
      callbackScope: this,
      loop: true,
    });

    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: Infinity,
    });

    this.barrels = this.physics.add.group({
      defaultKey: "barrel",
      maxSize: Infinity,
      immovable: true,
    });

    this.enemies = this.physics.add.group({
      defaultKey: "enemy",
      maxSize: Infinity,
      immovable: true
    });

    this.barrelManager = new BarrelManager(this.barrels, this.barrelSpeed);

    this.enemyManager = new EnemyManager(this.enemies, 200)

    this.time.delayedCall(500, () => this.barrelManager.generateBarrels(this, this.fireRate, this.bulletSpeed, this.difficulty), [], this);
    this.time.delayedCall(500, this.enemyManager.spawnEnemies, [], this);

    this.barrelCollider = this.physics.add.collider(this.barrels, this.character, this.onBarrelHit, undefined, this);

    this.physics.add.collider(this.barrels, this.bullets, this.onBarrelShoot as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

    this.enemyCollider = this.physics.add.collider(this.enemies, this.character, this.onEnemyHit, undefined, this);

    this.physics.add.collider(this.enemies, this.bullets, this.onEnemyShoot as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

    AnimationManager.explodeAnimation(this)
    AnimationManager.walkAnimation(this)

    EventBus.emit('current-scene-ready', this);
  }

  update(time: number, delta: number) {
    if (this.isGameOver) {
      return;
    }
    const velocity = this.speed * (delta / 1000); // Calculate velocity based on delta time
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

    this.barrels.getChildren().forEach((barrel) => {
      if (barrel instanceof Phaser.Physics.Arcade.Sprite) {
        const barrelHpText = barrel.getData('hpText');

        if (barrelHpText) {
          const currentHp = parseInt(barrelHpText._text, 10);
          if (currentHp <= 0) {
            barrelHpText.setActive(false).setVisible(false);
            barrel.setActive(false).setVisible(false);
            this.barrels.killAndHide(barrel);
          } else {
            barrelHpText.setPosition(barrel.x, barrel.y - barrel.height / 2 + 14);
          }
        }
      }
    });
  }

  onBarrelHit() {
    if (this.barrelCollider)
      this.physics.world.removeCollider(this.barrelCollider);
    this.barrelCollider = null;
    console.log('A barrel hit the character!',);
    this.endGame();
  }

  onBarrelShoot(barrel: Phaser.GameObjects.GameObject, bullet: Phaser.GameObjects.GameObject) {
    const barrelHp = barrel.getData('barrelHp');
    barrel.setData('barrelHp', barrelHp - 1);

    const barrelHpText = barrel.getData('hpText');
    if (barrelHpText) {
      barrelHpText.setText(`${barrel.getData('barrelHp')}`);
    }

    const barrelSprite = barrel as Phaser.Physics.Arcade.Sprite;
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
    if (barrel.getData('barrelHp') <= 0) {
      SoundManager.playPowerupSound(this);
      const barrelPowerUp = barrel.getData("powerUp");

      if (this.fireRate <= 100 && this.bulletSpeed >= 2000 && this.barrelSpawnEvent) {
        this.barrelSpawnEvent.remove();
      }

      if (barrelPowerUp === "fireRate") {
        if (this.enemyManager.getEnemySpeed() >= 400) {
          this.fireRate = Math.max(100, this.fireRate - 50);
        } else {
          this.fireRate = Math.max(400, this.fireRate - 50);
        }
        if (this.fireRate <= 800 && this.gunCount < 2) this.gunCount = 2;
        if (this.fireRate < 600 && this.gunCount < 3) this.gunCount = 3;
        if (this.fireRate === 400) {
          if (this.gunCount < 4) this.gunCount = 4;
        }
        this.updateFireRateTimer();
      } else if (barrelPowerUp === "bulletSpeed") {
        this.bulletSpeed = Math.min(2000, this.bulletSpeed + 300);
      }

      AnimationManager.playExplosion(this, barrelSprite.x, barrelSprite.y, false)

      AnimationManager.showPowerupPopup(this, barrelSprite.x, barrelSprite.y, barrelPowerUp);
      barrelSprite.setActive(false).setVisible(false).disableBody(true, true);
    }

    bulletSprite.setActive(false).setVisible(false);
  }

  onEnemyShoot(enemy: Phaser.GameObjects.GameObject, bullet: Phaser.GameObjects.GameObject) {
    this.score += 50;
    this.scoreText.setText(`Score: ${this.score}`);

    SoundManager.playBloodsplatSound(this)

    AnimationManager.bloodsplatAnimation(this, enemy as Phaser.Physics.Arcade.Sprite);

    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
    bulletSprite.setActive(false).setVisible(false);

    this.enemiesKilled += 1;
    this.totalEnemiesKilled += 1;
    if (this.enemiesKilled >= (this.difficulty * 2) + 10) {
      this.upDifficulty();
    }
  }

  onEnemyHit() {
    if (this.enemyCollider)
      this.physics.world.removeCollider(this.enemyCollider);
    this.enemyCollider = null;
    console.log('An Enemy hit the character!',);
    this.endGame();
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

  updateFireRateTimer() {
    let timeUntilNextFire = this.fireRate;

    if (this.fireRateEvent) {
      const elapsed = this.fireRate - (this.fireRateEvent.getElapsed() % this.fireRate);
      timeUntilNextFire = Math.min(elapsed, this.fireRate);
      this.fireRateEvent.remove();
    }

    this.time.addEvent({
      delay: timeUntilNextFire,
      callback: () => {
        this.fireBullet();
        this.fireRateEvent = this.time.addEvent({
          delay: this.fireRate,
          callback: this.fireBullet,
          callbackScope: this,
          loop: true,
        });
      },
      callbackScope: this,
    });
  }

  upDifficulty() {
    if (this.difficulty > 6) {
      this.enemyManager.setEnemySpeed(50);
    }
    this.enemiesKilled = 0;
    this.difficulty += 1;
    this.enemySize = this.difficulty * 2;
  }

  endGame() {
    this.character.setVelocity(0, 0);
    this.isGameOver = true;

    if (this.fireRateEvent) {
      this.fireRateEvent.destroy();
    }
    if (this.enemySpawnEvent) {
      this.enemySpawnEvent.destroy();
    }
    if (this.barrelSpawnEvent) {
      this.barrelSpawnEvent.destroy();
    }

    this.bullets.getChildren().forEach((bullet: Phaser.GameObjects.GameObject) => {
      if (bullet instanceof Phaser.Physics.Arcade.Sprite) {
        bullet.setActive(false).setVisible(false).disableBody(true, true);
      }
    })

    this.enemies.getChildren().forEach((enemy: Phaser.GameObjects.GameObject) => {
      if (enemy instanceof Phaser.Physics.Arcade.Sprite) {
        enemy.setVelocity(0, 0);
      }
    })

    this.barrels.getChildren().forEach((barrel: Phaser.GameObjects.GameObject) => {
      if (barrel instanceof Phaser.Physics.Arcade.Sprite) {
        barrel.setVelocity(0, 0);
      }
    })

    AnimationManager.playExplosion(this, this.character.x, this.character.y, true)
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
