function clearWebShots(webShots: Phaser.Physics.Arcade.Group) {
  webShots.getChildren().forEach((webShot: Phaser.GameObjects.GameObject) => {
    if (webShot instanceof Phaser.Physics.Arcade.Sprite) {
      webShot.setActive(false).setVisible(false).disableBody(true, true);
    }
  });
}
export { clearWebShots }