import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  scoreText: Phaser.GameObjects.Text;
  character: Phaser.Physics.Arcade.Sprite;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  aKey: Phaser.Input.Keyboard.Key;
  dKey: Phaser.Input.Keyboard.Key;
  speed: number;
  bullets: Phaser.Physics.Arcade.Group;
  barrels: Phaser.Physics.Arcade.Group;
  enemies: Phaser.Physics.Arcade.Group;
  enemySpeed: number = 200;
  barrelSpeed: number = 300;
  barrelHp: number;
  bulletSpeed: number;
  gunCount: number = 1;
  fireRate: number;
  lastFired: number;
  fireRateEvent: Phaser.Time.TimerEvent;
  enemySpawnEvent: Phaser.Time.TimerEvent;
  barrelSpawnEvent: Phaser.Time.TimerEvent;
  enemySize: number = 2;
  difficulty: number = 1;
  enemiesKilled: number = 0;
  score: number = 0;
  pointerDown: boolean = false;
  pointerX: number;
  isGameOver: boolean = false;

  constructor() {
    super('Game');
    this.speed = 800; // Character movement speed
    this.bulletSpeed = 1000; // Bullet movement speed
    this.fireRate = 1000; // Fire rate in milliseconds
    this.lastFired = 0;
  }

  create() {
    // Set up camera and background
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor("#c6c6c6");

    this.background = this.add.image(500, 1420, 'background');
    this.background.setAlpha(0.5);

    this.scoreText = this.add.text(150, 50, `Score: ${this.score}`, {
      fontFamily: 'Arial Black',
      fontSize: 54,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5).setDepth(100);

    // Create the character
    this.character = this.physics.add.sprite(500, 1650, 'character');

    // Set up keys
    this.aKey = this.input.keyboard!.addKey('A');
    this.dKey = this.input.keyboard!.addKey('D');

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (Phaser.Geom.Rectangle.Contains(this.character.getBounds(), pointer.x, pointer.y)) {
        this.pointerDown = true;
        this.pointerX = pointer.x;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.pointerDown) {
        console.log("x:", pointer);
        this.pointerX = pointer.x;
      }
    });

    this.input.on('pointerup', () => {
      this.pointerDown = false;
    });

    // Automatically fire bullets at the specified fire rate
    this.fireRateEvent = this.time.addEvent({
      delay: this.fireRate,
      callback: this.fireBullet,
      callbackScope: this,
      loop: true,
    });

    this.enemySpawnEvent = this.time.addEvent({
      delay: 5000,
      callback: this.spawnEnemies,
      callbackScope: this,
      loop: true,
    })

    this.barrelSpawnEvent = this.time.addEvent({
      delay: 10000,
      callback: this.generateBarrels,
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

    this.generateBarrels();
    this.spawnEnemies();

    this.physics.add.collider(this.barrels, this.character, this.onBarrelHit, undefined, this);

    this.physics.add.collider(this.barrels, this.bullets, this.onBarrelShoot as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

    this.physics.add.collider(this.enemies, this.character, this.onEnemyHit, undefined, this);

    this.physics.add.collider(this.enemies, this.bullets, this.onEnemyShoot as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

    this.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 15 }),
      frameRate: 10,
      hideOnComplete: true,
    });

    EventBus.emit('current-scene-ready', this);
  }

  update(time: number, delta: number) {
    if (this.isGameOver) {
      return;
    }
    const velocity = this.speed * (delta / 1000); // Calculate velocity based on delta time
    const smoothingFactor = 0.3;

    if (this.pointerDown) {
      const targetX = this.pointerX;
      this.character.x += (targetX - this.character.x) * smoothingFactor;
    }

    // Reset character position
    let dx = 0;

    // Check key presses and adjust character movement
    if (this.aKey.isDown) {
      dx -= velocity;
    }
    if (this.dKey.isDown) {
      dx += velocity;
    }

    if (this.pointerDown) {
      const screenMiddle = this.cameras.main.width / 2; // Middle of the screen
      if (this.pointerX < screenMiddle) {
        dx -= velocity; // Move left if touch is on the left side
      } else {
        dx += velocity; // Move right if touch is on the right side
      }
    }

    // Move the character
    this.character.x += dx;

    // Clamp the character within the bounds of the game
    this.character.x = Phaser.Math.Clamp(this.character.x, 0, this.camera.width);
    this.character.y = Phaser.Math.Clamp(this.character.y, 0, this.camera.height);

    this.barrels.getChildren().forEach((barrel: Phaser.GameObjects.GameObject) => {
      const barrelHpText = barrel.getData('hpText');
      if (barrel instanceof Phaser.Physics.Arcade.Sprite) {
        if (barrelHpText) {
          if (barrelHpText._text == "0") {
            barrelHpText.setActive(false).setVisible(false)
          }
          barrelHpText.setPosition(barrel.x, barrel.y - barrel.height / 2 + 14);
        }
      }
    });

  }

  onBarrelHit() {
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
      const barrelPowerUp = barrel.getData("powerUp");

      if (barrelPowerUp === "fireRate") {
        this.fireRate = Math.max(400, this.fireRate - 50);
        if (this.fireRate <= 800 && this.gunCount < 2) this.gunCount = 2;
        if (this.fireRate < 600 && this.gunCount < 3) this.gunCount = 3;
        if (this.fireRate === 400 && this.gunCount < 4) this.gunCount = 4;
        this.updateFireRateTimer();
      } else if (barrelPowerUp === "bulletSpeed") {
        this.bulletSpeed = Math.max(1500, this.bulletSpeed + 100);
      }

      const explosion = this.add.sprite(barrelSprite.x, barrelSprite.y, 'explosion');
      explosion.play('explode');

      this.showPowerUpPopup(barrelSprite.x, barrelSprite.y, barrelPowerUp);
      barrelSprite.setActive(false).setVisible(false).disableBody(true, true);
    }

    bulletSprite.setActive(false).setVisible(false);
  }

  onEnemyShoot(enemy: Phaser.GameObjects.GameObject, bullet: Phaser.GameObjects.GameObject) {
    const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;

    this.score += 50;
    this.scoreText.setText(`Score: ${this.score}`);

    enemySprite.setTexture('bloodsplat');
    enemySprite.body!.enable = false;
    this.tweens.add({
      targets: enemySprite,
      alpha: 0,
      scale: 0.8,
      duration: 600,
      onComplete: () => {
        enemySprite.setActive(false).setVisible(false).disableBody(true, true);
      },
    });
    bulletSprite.setActive(false).setVisible(false);
    this.enemiesKilled += 1;
    if (this.enemiesKilled >= (this.difficulty * 2) + 10) {
      this.upDifficulty();
    }
  }

  onEnemyHit() {
    console.log('An Enemy hit the character!',);
    this.endGame();
  }

  generateBarrels() {
    const cameraWidth = this.cameras.main.width;

    const positions = [
      { x: cameraWidth / 3.6, y: 0 },
      { x: cameraWidth * .75, y: 0 },
    ];

    positions.forEach((pos) => this.createBarrel(pos.x, pos.y));
  }

  createBarrel(x: number, y: number) {
    const barrelPowerUp = Math.random() < 0.5 || Math.random() > 0.7 ? "fireRate" : "bulletSpeed";
    const barrel = this.barrels.get(x, y);
    if (barrel) {
      barrel.setData('barrelHp', Phaser.Math.Between(this.difficulty, this.difficulty + 3));
      barrel
        .setActive(true)
        .setVisible(true)
        .enableBody();

      const barrelHpText = this.add.text(barrel.x, barrel.y - barrel.height / 2 - 10, `${barrel.getData('barrelHp')}`, {
        fontFamily: 'Arial',
        fontSize: 80,
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }).setOrigin(.5, -.2);

      barrel.setData('hpText', barrelHpText);
      barrel.setData('powerUp', barrelPowerUp)

      this.physics.velocityFromAngle(90, this.barrelSpeed, barrel.body.velocity);

      barrel.body.onWorldBounds = true;
      barrel.body.world.on(
        'worldbounds',
        (body: { gameObject: Phaser.Physics.Arcade.Sprite }) => {
          if (body.gameObject === barrel) {
            barrel.setActive(false).setVisible(false);
            barrel.getData('hpText').setVisible(false);
          }
        }
      );
    }
  }

  fireBullet() {
    for (let i = 0; i < this.gunCount; i++) {
      const bullet = this.bullets.get(this.character.x + (i - Math.floor(this.gunCount / 2)) * 20, this.character.y);
      if (bullet) {
        bullet.setActive(true).setVisible(true);
        const angleOffset = (i - Math.floor(this.gunCount / 2)) * 3;
        this.physics.velocityFromAngle(-90 + angleOffset, this.bulletSpeed, bullet.body.velocity);


        bullet.body.onWorldBounds = true;
        bullet.body.world.on('worldbounds', (body: { gameObject: Phaser.Physics.Arcade.Sprite; }) => {
          if (body.gameObject === bullet) {
            bullet.setActive(false).setVisible(false);
          }
        });
      }
    }
  }

  spawnEnemies() {
    if (this.fireRate <= 1000) {
      if (this.gunCount < 3 && this.gunCount > 1) {
        this.enemySize += 3;
      } else if (this.gunCount >= 3) {
        this.enemySize += 5;
      }
    }

    const maxWidth = Math.min(10, Math.floor(this.cameras.main.width / 120));
    const spacingX = this.cameras.main.width / (maxWidth + 1);
    const spacingY = 60;

    for (let i = 0; i < this.enemySize; i++) {
      const row = Math.floor(i / maxWidth);
      const col = i % maxWidth;

      const x = col * spacingX + spacingX / 2;
      const y = 100 + row * spacingY;

      const enemy = this.enemies.get(x, y);

      if (enemy) {
        enemy
          .setActive(true)
          .setVisible(true)
          .enableBody(true, x, y, true, true)
          .setAlpha(1)
          .setScale(2, 2)
          .setTexture('enemy')
          .setRotation(0);

        this.physics.velocityFromAngle(90, this.enemySpeed, enemy.body.velocity);

        enemy.body.onWorldBounds = true;
        enemy.body.world.on(
          'worldbounds',
          (body: { gameObject: Phaser.Physics.Arcade.Sprite }) => {
            if (body.gameObject === enemy) {
              enemy.setActive(false).setVisible(false);
            }
          }
        );
      }
    }
  }


  updateFireRateTimer() {
    if (this.fireRateEvent) {
      this.fireRateEvent.remove();
    }

    this.fireRateEvent = this.time.addEvent({
      delay: this.fireRate,
      callback: this.fireBullet,
      callbackScope: this,
      loop: true,
    });
  }

  updateBarrelSpawnTimer() {
    this.barrelSpawnEvent = this.time.addEvent({
      delay: 10000,
      callback: this.generateBarrels,
      callbackScope: this,
      loop: true,
    });
  }

  updateEnemySpawnTimer() {
    this.enemySpawnEvent = this.time.addEvent({
      delay: 5000,
      callback: this.spawnEnemies,
      callbackScope: this,
      loop: true,
    })
  }

  showPowerUpPopup(x: number, y: number, powerUp: string) {
    const powerText = powerUp === "fireRate" ? "Fire Rate" : "Bullet Speed";
    const text = this.add.text(x, y, `+${powerText.toUpperCase()}`, {
      fontFamily: 'Arial',
      fontSize: '40px',
      color: '#fcba03',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 150,
      alpha: 0,
      duration: 2500,
      ease: 'power2',
      onComplete: () => text.destroy(),
    });
  }

  upDifficulty() {
    if (this.difficulty > 10) {
      this.enemySpeed += 50;
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

    const explosion = this.add.sprite(this.character.x, this.character.y, 'explosion');

    explosion.play({ key: 'explode', repeat: -1 });

    this.time.delayedCall(3000, () => {
      this.changeScene();
    });

    explosion.on('animationcomplete', () => {
      explosion.destroy();
    });
  }

  changeScene() {
    this.bulletSpeed = 1000;
    this.fireRate = 1000;
    this.enemySpeed = 200;
    this.lastFired = 0;
    this.gunCount = 1;
    this.enemySize = 2;
    this.difficulty = 1;
    this.enemiesKilled = 0;
    this.score = 0;
    this.isGameOver = false;
    this.scene.start('GameOver');
  }
}
