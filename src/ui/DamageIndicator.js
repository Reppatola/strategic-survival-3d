// Красная вспышка по краям экрана при получении урона.
// Чисто визуальный эффект — не знает ни о ком.
export class DamageIndicator {
    constructor() {
        this.el = document.createElement('div');
        Object.assign(this.el.style, {
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(255,0,0,0) 35%, rgba(255,0,0,0.75) 100%)',
            pointerEvents: 'none',
            opacity: 0,
            zIndex: 5,
        });
        document.body.appendChild(this.el);

        this.timer = 0;
        this.duration = 0.45;
    }

    // Вызывается, когда игрок получает урон
    flash(intensity = 1) {
        this.timer = this.duration * intensity;
    }

    update(dt) {
        if (this.timer > 0) {
            this.timer -= dt;
            this.el.style.opacity = Math.max(0, this.timer / this.duration);
        } else if (this.el.style.opacity !== '0') {
            this.el.style.opacity = 0;
        }
    }
}