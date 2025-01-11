import { AnimationManager } from "./animationManager";

export class BossManager {
  private boss: Phaser.Physics.Arcade.Sprite | null;
  webShots: Phaser.Physics.Arcade.Group;

  constructor(boss: Phaser.Physics.Arcade.Sprite, webShots: Phaser.Physics.Arcade.Group) {
    this.boss = boss;
    this.webShots = webShots
  }

  spawnBoss(scene: Phaser.Scene, cameraWidth: number) {
    this.boss = scene.physics.add.sprite(cameraWidth / 2, -200, "boss").setScale(4);
    this.boss.body!.setCircle(25);

    AnimationManager.bossMoveAnimation(scene);
    AnimationManager.bossAttackAnimation(scene);

    this.boss.play('bossMove');

    scene.tweens.add({
      targets: this.boss,
      y: 200,
      ease: 'Linear',
      duration: 2000,
      onUpdate: () => {
        if (this.boss && this.boss.body!.y >= 37) {
          this.boss.anims.stop();
        }
      },
      onComplete: () => {
        this.startAttackMovement(scene, cameraWidth);
      },
    });
  }

  startAttackMovement(scene: Phaser.Scene, cameraWidth: number) {
    if (!this.boss) return;

    const centerX = cameraWidth / 2;
    const movementDuration = 500;
    const pauseDuration = 650;
    const edgeOffset = 300;

    const movementPattern = [
      { x: centerX - edgeOffset, y: 200 },
      { x: centerX, y: 400 },
      { x: centerX - 80, y: 300 },
      { x: centerX + edgeOffset, y: 200 },
      { x: centerX + 80, y: 300 },
    ];

    let currentStep = 0;

    const moveBoss = () => {
      if (!this.boss) return;

      const target = movementPattern[currentStep];

      this.boss.play('bossMove');

      scene.tweens.add({
        targets: this.boss,
        x: target.x,
        y: target.y,
        ease: 'Linear',
        duration: movementDuration,
        onComplete: () => {
          if (!this.boss) return;

          this.boss.anims.stop();

          scene.time.delayedCall(pauseDuration, () => {
            if (!this.boss) return;

            this.boss.play('bossAttack');

            this.fireWebAttack();

            currentStep = (currentStep + 1) % movementPattern.length;
            moveBoss();
          });
        },
      });
    };
    moveBoss();
  }

  fireWebAttack() {
    if (!this.boss) return;

    const webShot = this.webShots.get(this.boss.x, this.boss.y + 50);
    if (!webShot) return;

    webShot.setActive(true).setVisible(true).setScale(0.5);
    webShot.setVelocityY(1000);
  }

}
