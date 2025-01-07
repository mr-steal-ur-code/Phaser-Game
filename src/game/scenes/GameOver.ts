import { CST } from '../CST';
import { EventBus } from '../EventBus';

export class GameOver extends Phaser.Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  gameOverText: Phaser.GameObjects.Text;
  restartBtn: Phaser.GameObjects.Text;

  constructor() {
    super(CST.SCENES.GAMEOVER);
  }

  create(data: { score: number, enemiesKilled: number }) {
    this.camera = this.cameras.main
    this.camera.setBackgroundColor("#c6c6c6");

    this.gameOverText = this.add
      .text(this.camera.width / 2, this.camera.height / 2, "Game Over", {
        fontFamily: "Arial Black",
        fontSize: "72px",
        color: "#ffffff",
        stroke: "#ff0000",
        strokeThickness: 10,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setAlpha(0)
      .setScale(0.5);
    this.tweens.add({
      targets: this.gameOverText,
      alpha: 1,
      scale: 1.5,
      duration: 1500,
      ease: "Bounce.easeOut",
    });

    this.add
      .text(this.camera.width / 2, (this.camera.height / 2) - 300, `Final Score: ${data.score || 0}`, {
        fontSize: "60px",
        color: "#ed78b2",
        stroke: "#e5003f",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(this.camera.width / 2, (this.camera.height / 2) - 400, `Enemies Killed: ${data.enemiesKilled || 0}`, {
        fontSize: "60px",
        color: "#78b2ed",
        stroke: "#003fe5",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.restartBtn = this.add
      .text(this.camera.width / 2, (this.camera.height / 2) + 300, "Restart", {
        fontFamily: "Arial Black",
        fontSize: "80px",
        color: "#ffffff",
        stroke: "#00ff00",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.restart())
      .on("pointerover", () => {
        this.restartBtn.setScale(1.2);
      })
      .on("pointerout", () => {
        this.restartBtn.setScale(1).setStyle({ color: "#ffffff" });
      });

    EventBus.emit('current-scene-ready', this);
  }

  changeScene() {
    this.scene.start(CST.SCENES.MAINMENU);
  }

  restart() {
    this.scene.start(CST.SCENES.GAME)
  }
}
