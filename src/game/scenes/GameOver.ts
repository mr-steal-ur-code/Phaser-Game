import { EventBus } from '../EventBus';

export class GameOver extends Phaser.Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  gameOverText: Phaser.GameObjects.Text;
  restartBtn: Phaser.GameObjects.Text;

  constructor() {
    super('GameOver');
  }

  create() {
    this.camera = this.cameras.main
    this.camera.setBackgroundColor("#c6c6c6");

    this.gameOverText = this.add.text(512, 384, 'Game Over', {
      fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
      stroke: '#000000', strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5).setDepth(100);

    this.restartBtn = this.add.text(500, window.outerHeight, "Restart", {
      fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
      stroke: '#000000', strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.restart())
      .on('pointerover', () => {
        this.restartBtn.setScale(1.3);
      })
      .on('pointerout', () => {
        this.restartBtn.setScale(1);
      });

    EventBus.emit('current-scene-ready', this);
  }

  changeScene() {
    this.scene.start('MainMenu');
  }

  restart() {
    this.scene.start('Game')
  }
}
