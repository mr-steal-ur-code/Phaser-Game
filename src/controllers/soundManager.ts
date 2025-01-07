export class SoundManager {
  static playGameMusic(scene: Phaser.Scene) {
    scene.sound.play("main_game_music", {
      loop: true,
      volume: 1
    })
  }

  static playBloodsplatSound(scene: Phaser.Scene) {
    scene.sound.play("splat", {
      loop: false,
      volume: 1
    })
  }

  static playShootSound(scene: Phaser.Scene) {
    scene.sound.play('shoot', {
      loop: false,
      volume: .1
    });
  }

  static playExplosionSound(scene: Phaser.Scene, count: number) {
    let playCount = 0;
    const sound = scene.sound.add("explode", { volume: 0.7 });

    const playSound = () => {
      if (playCount < count) {
        playCount++;
        sound.play();
      }
    };

    sound.on('complete', () => {
      playSound();
    });

    playSound();
  }

  static playPowerupSound(scene: Phaser.Scene) {
    const sound = scene.sound.add("power_up", { volume: 0.7 });
    sound.play();
  }
}
