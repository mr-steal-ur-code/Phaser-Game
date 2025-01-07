export class EnemyManager {
  private enemies: Phaser.Physics.Arcade.Group;
  private enemySpeed: number;

  constructor(enemyGroup: Phaser.Physics.Arcade.Group, enemySpeed: number) {
    this.enemies = enemyGroup;
    this.enemySpeed = enemySpeed
  }

  spawnEnemies(scene: Phaser.Scene, cameraWidth: number, fireRate: number, gunCount: number, enemySize: number) {
    if (fireRate <= 1000) {
      if (gunCount < 3 && gunCount > 1) {
        enemySize += 3;
      } else if (gunCount >= 3) {
        enemySize += 5;
      }
    }

    const maxWidth = Math.min(10, Math.floor(cameraWidth / 120));

    const spacingX = cameraWidth / (maxWidth + 1);
    const spacingY = 60;

    for (let i = 0; i < enemySize; i++) {
      const row = Math.floor(i / maxWidth);
      const col = i % maxWidth;

      const randomOffset = Phaser.Math.Between(50, 100);
      const x = col * spacingX + spacingX / 2 + randomOffset;
      const y = 100 + row * spacingY + randomOffset;

      const enemy = this.enemies.get(x, y);

      if (enemy) {
        enemy
          .setActive(true)
          .setVisible(true)
          .enableBody(true, x, y, true, true)
          .setAlpha(1)
          .setScale(2.5)
          .setTexture('enemy')
          .setAngle(180);

        enemy.body.setCircle(25);

        scene.physics.velocityFromAngle(90, this.enemySpeed, enemy.body.velocity);

        enemy.play('enemyWalk');
      }
    }
  }
}