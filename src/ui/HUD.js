import { t } from '../i18n/index.js';

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
        this.alertEl.textContent = t('alert');
        document.body.appendChild(this.alertEl);

        this.gameOverEl = document.createElement('div');
        Object.assign(this.gameOverEl.style, {
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', zIndex: 20,
            font: 'bold 42px monospace', color: '#ff4444',
            textShadow: '0 2px 8px rgba(0,0,0,.8)',
            pointerEvents: 'none', display: 'none',
        });
        this.gameOverEl.textContent = t('gameOver');
        document.body.appendChild(this.gameOverEl);
    }

    update(player, noise, alert) {
        const filled = Math.ceil(player.hp / 10);
        const hpBar = '█'.repeat(filled) + '░'.repeat(10 - filled);

        // Локализованные подписи
        const hpLabel    = t('hud.hp');
        const dbLabel    = t('hud.db');
        const aimLabel   = t('hud.aim');
        const stateLabel = t(`hud.state.${player.state}`);

        this.el.textContent =
            `${hpLabel} ${hpBar} ${player.hp.toFixed(0)}\n` +
            `${dbLabel} ${noise.total.toFixed(0)}  ·  ${stateLabel}\n` +
            `${aimLabel}: ${player.position.x.toFixed(0)}, ${player.position.z.toFixed(0)}`;

        if (alert.active) {
            this.alertEl.style.display = 'block';
            const tm = performance.now() * 0.005;
            this.alertEl.style.opacity = 0.6 + Math.sin(tm) * 0.4;
        } else {
            this.alertEl.style.display = 'none';
        }

        this.gameOverEl.style.display = player.dead ? 'block' : 'none';
    }
}