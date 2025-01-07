export class AnimationManager {
  static explodeAnimation(scene: Phaser.Scene) {
    scene.anims.create({
      key: 'explode',
      frames: Array.from({ length: 10 }, (_, i) => ({
        key: `Circle_explosion${i + 1}`,
      })),
      frameRate: 15
    });
  }

  static playExplosion(scene: Phaser.Scene, x: number, y: number, repeat: boolean) {
    const explosionSprite = scene.add.sprite(x, y, 'Circle_explosion1');
    explosionSprite.setScale(1.5);

    explosionSprite.play({
      key: 'explode',
      repeat: repeat ? -1 : 0,
    });

    explosionSprite.on('animationcomplete', () => {
      explosionSprite.setVisible(false);
    });
  }

  static walkAnimation(scene: Phaser.Scene) {
    scene.anims.create({
      key: 'enemyWalk',
      frames: scene.anims.generateFrameNumbers('enemy', { start: 4, end: 9 }),
      frameRate: 10,
      repeat: -1,
    });
  }

  static bloodsplatAnimation(scene: Phaser.Scene, enemySprite: Phaser.Physics.Arcade.Sprite) {
    const bloodSplat = scene.add.sprite(enemySprite.x, enemySprite.y, 'bloodsplat');
    bloodSplat.setScale(1.5).setAlpha(1);

    scene.tweens.add({
      targets: bloodSplat,
      alpha: 0,
      scale: 0.8,
      duration: 600,
      onComplete: () => {
        bloodSplat.destroy();
      },
    });
    enemySprite.body!.enable = false;
    enemySprite.setActive(false).setVisible(false).disableBody(true, true);
  }

  static showPowerupPopup(scene: Phaser.Scene, x: number, y: number, powerUp: string) {
    const powerText = powerUp === "fireRate" ? "Fire Rate" : "Bullet Speed";
    const text = scene.add.text(x, y, `+${powerText.toUpperCase()}`, {
      fontFamily: 'Arial',
      fontSize: '40px',
      color: '#fcba03',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    scene.tweens.add({
      targets: text,
      y: y - 150,
      alpha: 0,
      duration: 2500,
      ease: 'power2',
      onComplete: () => text.destroy(),
    });
  }
}