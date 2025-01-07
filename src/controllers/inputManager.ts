export class InputManager {
  private scene: Phaser.Scene;
  private keys: { [key: string]: Phaser.Input.Keyboard.Key } = {};
  private pointerDown: boolean = false;
  private pointerX: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initKeyboardInput();
    this.initPointerInput();
  }

  private initKeyboardInput() {
    this.keys['A'] = this.scene.input.keyboard!.addKey('A');
    this.keys['D'] = this.scene.input.keyboard!.addKey('D');
  }

  private initPointerInput() {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const bottomThreshold = this.scene.cameras.main.height * 0.6;
      if (pointer.y >= bottomThreshold) {
        this.pointerDown = true;
        this.pointerX = pointer.x;
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.pointerDown) {
        this.pointerX = pointer.x;
      }
    });

    this.scene.input.on('pointerup', () => {
      this.pointerDown = false;
    });
  }

  public isKeyPressed(key: string): boolean {
    return this.keys[key]?.isDown || false;
  }

  public getPointerDown(): boolean {
    return this.pointerDown;
  }

  public getPointerX(): number {
    return this.pointerX;
  }
}