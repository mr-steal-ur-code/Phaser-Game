import { AnimationManager } from '../../controllers/animationManager';
import { BarrelManager } from '../../controllers/barrelManager';
import { EnemyManager } from '../../controllers/enemyManager';
import { InputManager } from '../../controllers/inputManager';
import { SoundManager } from '../../controllers/soundManager';
import { CST } from '../CST';
import { EventBus } from '../EventBus';

export class Game extends Phaser.Scene {
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
  enemiesKilled: number;
  totalEnemiesKilled: number;
  score: number = 0;
  isGameOver: boolean = false;
  level: number;
  maxEnemySpeed: number = 1200;
  maxBarrelCount: number = 2;
  barrelsDestroyed: number;
  accumulatedTime: number = 0;

  enemyCountPerLevel: { [key: number]: number } = {
    1: 7,
    2: 10,
    3: 15,
    4: 18,
    5: 23,
    6: 28,
    7: 34,
    8: 45,
    9: 60
  }

  constructor() {
    super(CST.SCENES.GAME);
    this.speed = 1000;
  }

  create(data: {
    bulletSpeed: number, fireRate: number, gunCount: number, totalEnemiesKilled: number, level: number;
    score: number
  }) {
    this.isGameOver = false;
    this.bulletSpeed = data?.bulletSpeed || 1000;
    this.fireRate = data?.fireRate || 1000;
    this.gunCount = data?.gunCount || 1;
    this.enemiesKilled = 0;
    this.totalEnemiesKilled = data?.totalEnemiesKilled || 0;
    this.score = data?.score || 0;
    this.level = data?.level || 1;
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor("#c6c6c6");
    this.enemySize = this.enemyCountPerLevel[this.level] || this.level * 10;
    this.barrelsDestroyed = 0;


    this.background = this.add.image(500, 1420, 'background');
    this.background.setAlpha(0.5);

    SoundManager.playGameMusic(this);

    const levelText = this.add
      .text(this.camera.width / 2, -100, `Level ${this.level}`, {
        fontFamily: "Arial Black",
        fontSize: "120px",
        color: "#ffffff",
        stroke: "#800080",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: levelText,
      y: this.camera.height / 2,
      duration: 800,
      ease: "Power2",
      onComplete: () => {
        this.time.delayedCall(1600, () => {
          this.tweens.add({
            targets: levelText,
            y: this.camera.height + 100,
            duration: 800,
            ease: "Power2",
            onComplete: () => {
              levelText.destroy();
            },
          });
        });
      },
    });

    this.scoreText = this.add.text(250, 50, `Score: ${this.score}`, {
      fontFamily: 'Arial Black',
      fontSize: 54,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5).setDepth(100);

    // Create the character
    this.character = this.physics.add.sprite(500, 1700, 'character');

    this.inputManager = new InputManager(this);

    // Automatically fire bullets at the specified fire rate
    this.time.delayedCall(4000, () => {
      this.fireRateEvent = this.time.addEvent({
        delay: this.fireRate,
        callback: this.fireBullet,
        callbackScope: this,
        loop: true,
      })
    })

    this.enemySpawnEvent = this.time.addEvent({
      delay: 5000,
      callback: () => this.enemyManager.spawnEnemies(this, this.camera.width, this.enemySize),
      callbackScope: this,
      loop: true,
    })

    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: Infinity,
    });

    this.barrels = this.physics.add.group({
      defaultKey: "barrel",
      maxSize: this.maxBarrelCount,
      immovable: true,
    });

    this.enemies = this.physics.add.group({
      defaultKey: "enemy",
      maxSize: this.enemySize,
      immovable: true
    });

    this.barrelManager = new BarrelManager(this.barrels, this.barrelSpeed);

    this.enemyManager = new EnemyManager(this.enemies, 200)

    this.time.delayedCall(7000, () => {
      const remainingBarrels = this.maxBarrelCount - this.barrelsDestroyed;
      this.barrelManager.generateBarrels(this, this.fireRate, this.bulletSpeed, this.level, remainingBarrels)
    }, [], this);
    this.time.delayedCall(100, this.enemyManager.spawnEnemies, [], this);

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

    this.accumulatedTime += delta;

    if (this.accumulatedTime >= 500) {
      this.accumulatedTime = 0;
      this.barrels.getChildren().forEach((barrel: Phaser.GameObjects.GameObject) => {
        if (barrel instanceof Phaser.Physics.Arcade.Sprite) {
          if (barrel.y > this.cameras.main.height + barrel.height) {
            this.barrelManager.recycleBarrel(barrel);
            const remainingBarrels = this.maxBarrelCount - this.barrelsDestroyed;
            this.time.delayedCall(5000, () => {
              this.barrelManager.generateBarrels(this, this.fireRate, this.bulletSpeed, this.level, remainingBarrels)
            }, [], this);
          }

          const barrelHpText = barrel.getData("hpText") as Phaser.GameObjects.Text | undefined;
          if (barrelHpText) {
            barrelHpText.setPosition(barrel.x, barrel.y - barrel.height / 2 - 10);
          }
        }
      });
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
      this.barrelsDestroyed += 1;
      SoundManager.playPowerupSound(this);
      const barrelPowerUp = barrel.getData("powerUp");

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
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
    bulletSprite.setActive(false).setVisible(false);

    if (enemy.getData("canBeHit")) {
      this.score += 50;
      this.scoreText.setText(`Score: ${this.score}`);

      SoundManager.playBloodsplatSound(this)

      AnimationManager.bloodsplatAnimation(this, enemy as Phaser.Physics.Arcade.Sprite);

      this.enemiesKilled += 1;
      this.totalEnemiesKilled += 1;

      if (this.enemySpawnEvent) {
        this.enemySpawnEvent.destroy();

        this.enemySpawnEvent = this.time.addEvent({
          delay: 100,
          callback: () => this.enemyManager.spawnEnemies(this, this.camera.width, (this.enemySize - this.enemiesKilled)),
          callbackScope: this,
          loop: true,
        })
      }

      if (this.enemiesKilled >= this.enemySize) {
        const levelCompleteText = this.add
          .text(this.camera.width / 2, -100, `Level ${this.level} \nComplete`, {
            fontFamily: "Arial Black",
            fontSize: "120px",
            color: "#ffffff",
            stroke: "#800080",
            strokeThickness: 8,
            align: "left",
          })
          .setOrigin(0.5);

        this.tweens.add({
          targets: levelCompleteText,
          y: this.camera.height / 2,
          duration: 400,
          ease: "Power2",
          onComplete: () => {
            this.time.delayedCall(900, () => {
              this.tweens.add({
                targets: levelCompleteText,
                y: this.camera.height + 100,
                duration: 400,
                ease: "Power2",
                onComplete: () => {
                  levelCompleteText.destroy();
                },
              });
            });
          },
        });

        if (this.level % 5 === 0) {
          this.time.delayedCall(2500, this.bossScene, [], this);
        } else {
          this.time.delayedCall(2500, this.nextLevel, [], this);
        }
      }
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

    this.enemyManager.freezeEnemies()

    this.barrelManager.freezeBarrels();

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

  nextLevel() {
    this.sound.stopAll();
    if (this.level > 5 && this.enemyManager.getEnemySpeed() < this.maxEnemySpeed) {
      this.enemyManager.setEnemySpeed(100);
    }
    this.enemiesKilled = 0;
    this.scene.start(CST.SCENES.GAME, {
      bulletSpeed: this.bulletSpeed,
      fireRate: this.fireRate,
      gunCount: this.gunCount,
      totalEnemiesKilled: this.totalEnemiesKilled,
      score: this.score,
      level: this.level + 1
    });
  }

  bossScene() {
    this.sound.stopAll();
    this.scene.start(CST.SCENES.BOSS, {
      bulletSpeed: this.bulletSpeed,
      fireRate: this.fireRate,
      gunCount: this.gunCount,
      totalEnemiesKilled: this.totalEnemiesKilled,
      score: this.score,
      level: this.level
    });
  }
}
