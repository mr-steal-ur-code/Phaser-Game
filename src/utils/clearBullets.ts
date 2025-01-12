function clearBullets(bullets: Phaser.Physics.Arcade.Group) {
  bullets.getChildren().forEach((bullet: Phaser.GameObjects.GameObject) => {
    if (bullet instanceof Phaser.Physics.Arcade.Sprite) {
      bullet.setActive(false).setVisible(false).disableBody(true, true);
    }
  })
}
export { clearBullets }