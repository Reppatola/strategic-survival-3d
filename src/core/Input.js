export default class Input {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0, clicked: false };

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  // Возвращает вектор направления (-1..1 по X, -1..1 по Z)
  getMoveVector() {
    let x = 0, z = 0;
    if (this.isDown('KeyA')) x -= 1;
    if (this.isDown('KeyD')) x += 1;
    if (this.isDown('KeyW')) z -= 1;
    if (this.isDown('KeyS')) z += 1;
    return { x, z };
  }

  isSprinting() {
    return this.isDown('ShiftLeft') || this.isDown('ShiftRight');
  }

  isCrouching() {
    return this.isDown('KeyC');
  }
}