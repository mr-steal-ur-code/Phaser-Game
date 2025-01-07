export class SoundManager {
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
