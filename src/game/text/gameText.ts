function gameLevelText(scene: Phaser.Scene, level: number) {
  const levelText = scene.add
    .text(scene.cameras.main.width / 2, -100, `Level ${level}`, {
      fontFamily: "sans-serif",
      fontSize: "120px",
      color: "#ffffff",
      stroke: "#800080",
      strokeThickness: 8,
      align: "center",
    })
    .setOrigin(0.5);

  scene.tweens.add({
    targets: levelText,
    y: scene.cameras.main.height / 2,
    duration: 800,
    ease: "Power2",
    onComplete: () => {
      scene.time.delayedCall(1600, () => {
        scene.tweens.add({
          targets: levelText,
          y: scene.cameras.main.height + 100,
          duration: 800,
          ease: "Power2",
          onComplete: () => {
            levelText.destroy();
          },
        });
      });
    },
  });
}

function gameScoreText(scene: Phaser.Scene, score: number) {
  return scene.add.text(250, 50, `Score: ${score}`, {
    fontFamily: 'sans-serif',
    fontSize: 54,
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 8,
    align: 'center'
  }).setOrigin(0.5).setDepth(100);
}
function updateGameScoreText(scoreText: Phaser.GameObjects.Text, score: number): void {
  scoreText.setText(`Score: ${score}`);
}
export { gameLevelText, gameScoreText, updateGameScoreText }