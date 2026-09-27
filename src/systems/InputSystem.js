// Собирает состояние клавиатуры и мыши.
// pressed* — одноразовые события этого кадра.
export class InputSystem {
    constructor() {
        this.keys = {};
        this.mouseNDC = { x: 0, y: 0 };
        this.mouseDown = false;
        this._pressed = new Set();

        addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) this._pressed.add(e.code);
            this.keys[e.code] = true;
        });
        addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        addEventListener('pointermove', (e) => {
            this.mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        addEventListener('pointerdown', (e) => { if (e.button === 0) this.mouseDown = true; });
        addEventListener('pointerup',   (e) => { if (e.button === 0) this.mouseDown = false; });
    }

    sample() {
        const ix = (this.keys.KeyD ? 1 : 0) - (this.keys.KeyA ? 1 : 0);
        const iz = (this.keys.KeyS ? 1 : 0) - (this.keys.KeyW ? 1 : 0);

        const result = {
            ix, iz,
            moving: ix !== 0 || iz !== 0,
            sprint: this.keys.ShiftLeft || this.keys.ShiftRight,
            crouch: this.keys.KeyC,
            fire: this.mouseDown,
            mouseNDC: this.mouseNDC,
            pressedQ: this._pressed.has('KeyQ'),
            pressedE: this._pressed.has('KeyE'),
            pressedF: this._pressed.has('KeyF'),
            pressedV: this._pressed.has('KeyV'),
        };

        this._pressed.clear();
        return result;
    }
}