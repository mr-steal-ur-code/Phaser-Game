export class BarrelManager {
  private barrels: Phaser.Physics.Arcade.Group;
  private barrelSpeed: number;

  constructor(barrelGroup: Phaser.Physics.Arcade.Group, barrelSpeed: number) {
    this.barrels = barrelGroup;
    this.barrelSpeed = barrelSpeed;
  }

  generateBarrels(scene: Phaser.Scene, fireRate: number, bulletSpeed: number, level: number, maxBarrelCount: number) {
    console.log("max barrel count: ", maxBarrelCount);

    const cameraWidth = scene.cameras.main.width;
    const positions = [
      { x: cameraWidth / 3.6, y: -100 },
      { x: cameraWidth * 0.75, y: -100 },
    ];

    if (maxBarrelCount === 1) {
      this.createBarrel(scene, fireRate, bulletSpeed, positions[0].x, positions[0].y, level);
    } else if (maxBarrelCount >= 2) {
      positions.forEach((pos) => this.createBarrel(scene, fireRate, bulletSpeed, pos.x, pos.y, level));
    }
  }

  createBarrel(scene: Phaser.Scene, fireRate: number, bulletSpeed: number, x: number, y: number, level: number) {

    const barrelPowerUp = this.determinePowerUp(fireRate, bulletSpeed)

    const barrel = this.barrels.get(x, y) as Phaser.Physics.Arcade.Sprite;

    if (barrel) {
      barrel.setData("barrelHp", Phaser.Math.Between(level, level + 2));
      barrel.setActive(true).setVisible(true).enableBody();

      const barrelHpText = scene.add.text(
        barrel.x,
        barrel.y - barrel.height / 2 - 10,
        `${barrel.getData("barrelHp")}`,
        {
          fontFamily: "Arial",
          fontSize: 80,
          color: "#ff0000",
          stroke: "#000000",
          strokeThickness: 3,
          align: "center",
        }
      ).setOrigin(0.5, -0.2);

      barrel.setData("hpText", barrelHpText);
      barrel.setData("powerUp", barrelPowerUp);

      scene.physics.velocityFromAngle(90, this.barrelSpeed, barrel.body!.velocity);
    }
  }

  recycleBarrel(barrel: Phaser.Physics.Arcade.Sprite) {
    console.log("killing barrel");

    this.barrels.add(barrel);
    barrel.destroy();

    const barrelHpText = barrel.getData("hpText") as Phaser.GameObjects.Text | undefined;
    if (barrelHpText) {
      barrelHpText.setVisible(false);
    }
  }

  freezeBarrels() {
    this.barrels.getChildren().forEach((barrel: Phaser.GameObjects.GameObject) => {
      if (barrel instanceof Phaser.Physics.Arcade.Sprite) {
        barrel.setVelocity(0, 0);

        const barrelHpText = barrel.getData("hpText");
        if (barrelHpText && barrelHpText instanceof Phaser.GameObjects.Text) {
          barrelHpText.setVisible(false);
        }
      }
    });
  }

  private determinePowerUp(fireRate: number, bulletSpeed: number): string | null {
    let powerUps = ["fireRate", "bulletSpeed"];
    if (fireRate <= 100) powerUps = powerUps.filter((pu) => pu !== "fireRate");
    if (bulletSpeed >= 2000) powerUps = powerUps.filter((pu) => pu !== "bulletSpeed");

    if (powerUps.length === 0) return null;

    const ranNum = Math.random();
    return powerUps[ranNum < 0.5 || ranNum > 0.7 ? 0 : 1];
  }

}
