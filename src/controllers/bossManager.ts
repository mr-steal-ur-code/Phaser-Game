import { AnimationManager } from "./animationManager";

export class BossManager {
  private boss: Phaser.Physics.Arcade.Sprite | null;
  private isBossAlive: boolean;
  webShots: Phaser.Physics.Arcade.Group;

  constructor(webShots: Phaser.Physics.Arcade.Group) {
    this.webShots = webShots;
    this.isBossAlive = false;
  }

  spawnBoss(scene: Phaser.Scene, cameraWidth: number, level: number) {
    this.boss = scene.physics.add.sprite(cameraWidth / 2, -200, "boss").setScale(4);
    this.boss.body!.setCircle(40);
    this.boss.setImmovable(true);
    this.isBossAlive = true;
    const bossHp: number = (level * 20);

    AnimationManager.bossMoveAnimation(scene);
    AnimationManager.bossAttackAnimation(scene);
    AnimationManager.bossDieAnimation(scene);
    this.boss.setData("hp", bossHp);
    this.boss.setData("maxHp", bossHp);
    this.boss.play('bossMove');

    scene.tweens.add({
      targets: this.boss,
      y: 200,
      ease: 'Linear',
      duration: 500,
      onUpdate: () => {
        if (this.boss && this.boss.body!.y >= 37) {
          this.boss.anims.stop();
        }
      },
      onComplete: () => {
        if (!this.boss || !this.isBossAlive) return;
        this.startAttackMovement(scene, cameraWidth);
      },
    });
  }

  startAttackMovement(scene: Phaser.Scene, cameraWidth: number) {
    if (!this.boss) return;

    const centerX = cameraWidth / 2;
    const movementDuration = 500;
    const pauseDuration = 500;
    const edgeOffset = 250;

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

      scene.tweens.add({
        targets: this.boss,
        x: target.x,
        y: target.y,
        ease: 'Linear',
        duration: movementDuration,
        onComplete: () => {
          if (!this.boss) return;

          this.boss.anims.stop();

          this.fireWebAttack();
          scene.time.delayedCall(pauseDuration, () => {
            if (!this.boss) return;
            this.boss.play('bossAttack');

            currentStep = (currentStep + 1) % movementPattern.length;
            scene.time.delayedCall(200, moveBoss);
          });
        },
      });
    };
    moveBoss();
  }

  fireWebAttack() {
    if (!this.boss) return;

    const webShot = this.webShots.get(this.boss.x + 50, this.boss.y + 105);
    if (!webShot) return;

    webShot.setActive(true).setVisible(true).setScale(0.5);
    webShot.setVelocityY(1000);
  }

  bossDeath(scene: Phaser.Scene) {
    if (!this.boss) return;

    this.boss.anims.stop();
    this.boss.play("bossDie");
    this.isBossAlive = false;

    scene.time.delayedCall(500, () => this.boss?.setActive(false).setVisible(false).disableBody(true, true));
    this.boss = null;
    console.log("Boss defeated!");
  }

  bossWin() {
    this.boss!.anims.stop();
    this.boss?.setActive(false).setVelocity(0, 0);
    this.boss = null;
  }

  getBoss(): Phaser.Physics.Arcade.Sprite | null {
    return this.boss;
  }

  getBossHp() {
    return this.boss?.getData("hp") || 0;
  }

  getBossMaxHp() {
    return this.boss?.getData("maxHp") || 0;
  }

  setBossHp(hp: number) {
    const currentHp = this.getBossHp();
    if (currentHp > 0) {
      this.boss?.setData("hp", currentHp - hp);
    }
  }

}
