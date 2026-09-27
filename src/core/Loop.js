// Игровой цикл. Отделён от рендера и логики.
// Только считает delta и вызывает update.
export class Loop {
    constructor(update) {
        this.update = update;
        this.running = false;
        this.lastTime = 0;
        this.elapsed = 0;
        this._tick = this._tick.bind(this);
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this._tick);
    }

    stop() {
        this.running = false;
    }

    _tick(now) {
        if (!this.running) return;
        requestAnimationFrame(this._tick);

        // Ограничиваем dt, чтобы после сворачивания вкладки игра не "прыгала"
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;
        this.elapsed += dt;

        this.update(dt, this.elapsed);
    }
}