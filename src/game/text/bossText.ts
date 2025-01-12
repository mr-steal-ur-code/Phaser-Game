function bossClearText(scene: Phaser.Scene) {
  const clearedText = scene.add.text(scene.cameras.main.width / 2, scene.cameras.main.height / 2 - 200, "Cleared!", {
    fontFamily: "sans-serif",
    fontSize: "100px",
    color: "#b3ffab",
    stroke: "#016936",
    strokeThickness: 12,
    shadow: {
      offsetX: 5,
      offsetY: 5,
      color: "#016936",
      blur: 10,
      fill: true,
    },
    align: "center",
  })
    .setOrigin(0.5)
    .setAlpha(0)
    .setDepth(100);

  scene.tweens.add({
    targets: clearedText,
    alpha: 1,
    scale: { from: 0.8, to: 1.2 },
    duration: 1000,
    ease: "Elastic.easeOut",
    yoyo: true,
  });
}

function bossIncomingText(scene: Phaser.Scene) {
  const incomingBossText = scene.add.text(
    scene.cameras.main.width / 2,
    scene.cameras.main.height / 2,
    "INCOMING BOSS",
    {
      fontFamily: "sans-serif",
      fontSize: "80px",
      color: "#ff4545",
      stroke: "#8b0000",
      strokeThickness: 10,
      align: "center",
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: "#8b0000",
        blur: 10,
        fill: true,
      },
    }
  )
    .setOrigin(0.5)
    .setAlpha(0)
    .setDepth(100);

  scene.tweens.add({
    targets: incomingBossText,
    alpha: 1,
    scale: { from: 1, to: 1.2 },
    yoyo: true,
    duration: 800,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  scene.tweens.add({
    targets: incomingBossText,
    tint: { from: 0xffffff, to: 0xff0000 },
    duration: 200,
    repeat: -1,
    yoyo: true,
  });
}

export { bossClearText, bossIncomingText }