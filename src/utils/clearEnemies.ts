function clearEnemies(enemies: Phaser.Physics.Arcade.Group) {
  enemies.getChildren().forEach((enemy: Phaser.GameObjects.GameObject) => {
    if (enemy instanceof Phaser.Physics.Arcade.Sprite) {
      enemy.setActive(false).setVelocity(0, 0);
    }
  })
}
export { clearEnemies }