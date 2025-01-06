import { GameObjects, Scene } from 'phaser';

import { EventBus } from '../EventBus';

export class MainMenu extends Scene {
  background: GameObjects.Image;
  logo: GameObjects.Image;
  playBtn: GameObjects.Text;
  logoTween: Phaser.Tweens.Tween | null;

  constructor() {
    super('MainMenu');
  }

  create() {
    this.background = this.add.image(500, 1800, 'background');

    this.logo = this.add.image(500, 300, 'logo').setDepth(100);

    this.playBtn = this.add.text(500, 800, 'Play', {
      fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
      stroke: '#000000', strokeThickness: 8,
      align: 'center'
    }).setScale(1.5).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.changeScene())
      .on('pointerover', () => {
        this.playBtn.setScale(1.7);
        this.sound.play('menu_hover', { volume: .2 });
      })
      .on('pointerout', () => {
        this.playBtn.setScale(1.5); // Reset the scale when not hovered
      });

    EventBus.emit('current-scene-ready', this);
  }

  changeScene() {
    if (this.logoTween) {
      this.logoTween.stop();
      this.logoTween = null;
    }

    this.scene.start('Game');
  }

  moveLogo(vueCallback: ({ x, y }: { x: number, y: number }) => void) {
    if (this.logoTween) {
      if (this.logoTween.isPlaying()) {
        this.logoTween.pause();
      }
      else {
        this.logoTween.play();
      }
    }
    else {
      this.logoTween = this.tweens.add({
        targets: this.logo,
        x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
        y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (vueCallback) {
            vueCallback({
              x: Math.floor(this.logo.x),
              y: Math.floor(this.logo.y)
            });
          }
        }
      });
    }
  }
}
