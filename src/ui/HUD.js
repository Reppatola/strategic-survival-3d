// HUD: HP, шум, состояние, статус тревоги, экран смерти.
export class HUD {
    constructor() {
        this.el = document.createElement('div');
        Object.assign(this.el.style, {
            position: 'fixed', top: '14px', left: '14px', zIndex: 10,
            font: '14px/1.5 monospace', color: '#fff',
            textShadow: '0 1px 3px rgba(0,0,0,.6)',
            background: 'rgba(0,0,0,.35)', padding: '10px 14px',
            borderRadius: '8px', pointerEvents: 'none', whiteSpace: 'pre',
        });
        document.body.appendChild(this.el);

        // Плашка «ТРЕВОГА»
        this.alertEl = document.createElement('div');
        Object.assign(this.alertEl.style, {
            position: 'fixed', top: '14px', left: '50%',
            transform: 'translateX(-50%)', zIndex: 15,
            font: 'bold 18px monospace', color: '#ff2e2e',
            textShadow: '0 2px 6px rgba(0,0,0,.8)',
            background: 'rgba(0,0,0,.55)', padding: '8px 20px',
            borderRadius: '6px', pointerEvents: 'none',
            display: 'none', letterSpacing: '3px',
        });
        this.alertEl.textContent = '⚠ ТРЕВОГА ⚠';
        document.body.appendChild(this.alertEl);

        // Экран смерти
        this.gameOverEl = document.createElement('div');
        Object.assign(this.gameOverEl.style, {
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', zIndex: 20,
            font: 'bold 42px monospace', color: '#ff4444',
            textShadow: '0 2px 8px rgba(0,0,0,.8)',
            pointerEvents: 'none', display: 'none',
        });
        this.gameOverEl.textContent = 'ВЫ ПОГИБЛИ';
        document.body.appendChild(this.gameOverEl);
    }

    update(player, noise, alert) {
        const filled = Math.ceil(player.hp / 10);
        const hpBar = '█'.repeat(filled) + '░'.repeat(10 - filled);

        this.el.textContent =
            `HP ${hpBar} ${player.hp.toFixed(0)}\n` +
            `dB ${noise.total.toFixed(0)}  ·  ${player.state}\n` +
            `прицел: ${player.position.x.toFixed(0)}, ${player.position.z.toFixed(0)}`;

        // Плашка тревоги с пульсацией
        if (alert.active) {
            this.alertEl.style.display = 'block';
            const t = performance.now() * 0.005;
            this.alertEl.style.opacity = 0.6 + Math.sin(t) * 0.4;
        } else {
            this.alertEl.style.display = 'none';
        }

        this.gameOverEl.style.display = player.dead ? 'block' : 'none';
    }
}