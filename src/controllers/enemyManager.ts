export class EnemyManager {
  private enemies: Phaser.Physics.Arcade.Group;
  private enemySpeed: number;
  private canEnemyMove: boolean;

  constructor(enemyGroup: Phaser.Physics.Arcade.Group, enemySpeed: number) {
    this.enemies = enemyGroup;
    this.enemySpeed = enemySpeed;
    this.canEnemyMove = true;
  }

  spawnEnemies(scene: Phaser.Scene, cameraWidth: number, enemySize: number) {
    const maxWidth = Math.min(10, Math.floor(cameraWidth / 120));

    const spacingX = cameraWidth / (maxWidth + 1);

    for (let i = 0; i < enemySize; i++) {
      const col = i % maxWidth;

      const randomOffsetX = Phaser.Math.Between(50, 100);
      const randomOffsetY = Phaser.Math.Between(-200, 0);
      const x = col * spacingX + spacingX / 2 + randomOffsetX;
      const y = randomOffsetY - 50;

      const enemy = this.enemies.get(x, y);
      const ranNum = Phaser.Math.Between(5, 25)

      if (enemy) {
        enemy
          .setActive(true)
          .setVisible(true)
          .enableBody(true, x, y, true, true)
          .setAlpha(1)
          .setScale(2.5)
          .setTexture('enemy')
          .setAngle(180)
          .setData("canBeHit", false);

        enemy.body.setCircle(25);

        let oscillationTime = 0;

        scene.time.addEvent({
          delay: 16,
          callback: () => {
            if (!this.canEnemyMove) return;
            oscillationTime += 0.016;
            const angle = 90 + ranNum * Math.sin(oscillationTime);
            scene.physics.velocityFromAngle(angle, this.enemySpeed, enemy.body.velocity);

            if (enemy.y > 0 && !enemy.getData("canBeHit")) {
              enemy.setData("canBeHit", true);
            }

            if (enemy.y > scene.cameras.main.height + enemy.height) {
              this.enemies.killAndHide(enemy);
            }
          },
          loop: true,
        });

        enemy.play('enemyWalk');
      }
    }
  }

  freezeEnemies() {
    this.canEnemyMove = false;
    this.enemies.getChildren().forEach((enemy: Phaser.GameObjects.GameObject) => {
      if (enemy instanceof Phaser.Physics.Arcade.Sprite) {
        enemy.setAngularVelocity(0).setAngularAcceleration(0).setAngularDrag(0)
      }
    })
  }

  public setEnemySpeed(speed: number) {
    this.enemySpeed += speed;
  }

  public getEnemySpeed() {
    return this.enemySpeed;
  }
}