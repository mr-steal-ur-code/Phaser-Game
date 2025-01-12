import { GameObjects, Scene } from 'phaser';

import { EventBus } from '../EventBus';
import { CST } from '../CST';

export class MainMenu extends Scene {
  background: GameObjects.Image;
  logo: GameObjects.Image;
  playBtn: GameObjects.Text;

  constructor() {
    super('MainMenu');
  }

  create() {
    this.background = this.add.image(500, 1800, 'background');

    this.logo = this.add.image(500, this.cameras.main.height - 200, 'logo').setDepth(100);

    this.add.text(500, 300, "Last Galaga Invaders", {
      fontSize: 70,
      strokeThickness: 10,
      stroke: "#000",
      color: "#b9b9b9",
      fontFamily: "fantasy"
    }).setOrigin(0.5).setDepth(150);

    this.playBtn = this.add.text(500, 900, 'Play', {
      fontFamily: 'sans-serif', fontSize: 70, color: 'white',
      stroke: 'green', strokeThickness: 6,
      align: 'center'
    }).setScale(1.5).setOrigin(0.5).setDepth(150).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        try {
          this.sound.unlock();
          this.changeScene();
        } catch (error) {
          alert(`error: , ${error}`);
          console.error('Error in changeScene:', error);
        }
      })
      .on('pointerover', () => {
        this.playBtn.setStyle({ stroke: "#800080" });
      })
      .on('pointerout', () => {
        this.playBtn.setStyle({ stroke: "#000000" });
      });

    EventBus.emit('current-scene-ready', this);
  }

  changeScene() {
    this.scene.start(CST.SCENES.GAME);
  }
}
