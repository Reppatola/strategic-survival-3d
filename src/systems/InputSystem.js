// Собирает состояние клавиатуры и мыши.
// Не знает ни о герое, ни о камере — просто отдаёт сырые данные.
export class InputSystem {
    constructor() {
        this.keys = {};
        this.mouseNDC = { x: 0, y: 0 };   // нормализованные координаты -1..1
        this.mouseDown = false;

        addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        addEventListener('keyup',   (e) => { this.keys[e.code] = false; });

        addEventListener('pointermove', (e) => {
            this.mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        addEventListener('pointerdown', (e) => { if (e.button === 0) this.mouseDown = true; });
        addEventListener('pointerup',   (e) => { if (e.button === 0) this.mouseDown = false; });
    }

    // Возвращает снимок состояния на текущий кадр.
    sample() {
        const ix = (this.keys.KeyD ? 1 : 0) - (this.keys.KeyA ? 1 : 0);
        const iz = (this.keys.KeyS ? 1 : 0) - (this.keys.KeyW ? 1 : 0);
        return {
            ix, iz,
            moving: ix !== 0 || iz !== 0,
            sprint: this.keys.ShiftLeft || this.keys.ShiftRight,
            crouch: this.keys.KeyC,
            fire: this.mouseDown,
            mouseNDC: this.mouseNDC,
        };
    }
}