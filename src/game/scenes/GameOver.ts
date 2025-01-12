import { CST } from '../CST';
import { EventBus } from '../EventBus';

export class GameOver extends Phaser.Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  gameOverText: Phaser.GameObjects.Text;
  restartBtn: Phaser.GameObjects.Text;
  mainMenuBtn: Phaser.GameObjects.Text;

  constructor() {
    super(CST.SCENES.GAMEOVER);
  }

  create(data: { score: number, enemiesKilled: number }) {
    this.camera = this.cameras.main
    this.camera.setBackgroundColor("#1e2a38");

    this.gameOverText = this.add
      .text(this.camera.width / 2, this.camera.height / 2, "Game Over", {
        fontFamily: "sans-serif",
        fontSize: "72px",
        color: "#d0f0ff",
        stroke: "#0d4b6d",
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
        color: "#adebeb",
        stroke: "#036666",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(this.camera.width / 2, (this.camera.height / 2) - 400, `Enemies Killed: ${data.enemiesKilled || 0}`, {
        fontSize: "60px",
        color: "#b8d8f8",
        stroke: "#0a417a",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.restartBtn = this.add
      .text(this.camera.width / 2, (this.camera.height / 2 + 200) + 300, "Restart", {
        fontFamily: "sans-serif",
        fontSize: "80px",
        color: "#d0f0ff",
        stroke: "#0d4b6d",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.restart())
      .on("pointerover", () => {
        this.restartBtn.setScale(1.2).setStyle({ color: "#adebeb" });
      })
      .on("pointerout", () => {
        this.restartBtn.setScale(1).setStyle({ color: "#d0f0ff" });
      });

    this.mainMenuBtn = this.add
      .text(this.camera.width / 2, (this.camera.height / 2) + 300, "Main Menu", {
        fontFamily: "sans-serif",
        fontSize: "80px",
        color: "#d0f0ff",
        stroke: "#0d4b6d",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.changeScene())
      .on("pointerover", () => {
        this.mainMenuBtn.setScale(1.2).setStyle({ color: "#adebeb" });
      })
      .on("pointerout", () => {
        this.mainMenuBtn.setScale(1).setStyle({ color: "#d0f0ff" });
      });

    EventBus.emit('current-scene-ready', this);
  }

  changeScene() {
    this.scene.start(CST.SCENES.MAINMENU);
  }

  restart() {
    this.scene.start(CST.SCENES.GAME, {})
  }
}
