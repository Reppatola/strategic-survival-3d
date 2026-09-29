import { t } from '../i18n/index.js';

export class HUD {
    constructor() {
        this.el = document.createElement('div');
        Object.assign(this.el.style, {
            position: 'fixed', top: '14px', left: '14px', zIndex: 10,
            font: '13px/1.5 monospace', color: '#fff',
            textShadow: '0 1px 3px rgba(0,0,0,.6)',
            background: 'rgba(0,0,0,.4)', padding: '10px 14px',
            borderRadius: '8px', pointerEvents: 'none', whiteSpace: 'pre',
        });
        document.body.appendChild(this.el);

        this.criticalEl = document.createElement('div');
        Object.assign(this.criticalEl.style, {
            position: 'fixed', top: '14px', left: '50%',
            transform: 'translateX(-50%)', zIndex: 15,
            font: 'bold 18px monospace', color: '#ff2e2e',
            textShadow: '0 2px 6px rgba(0,0,0,.8)',
            background: 'rgba(0,0,0,.55)', padding: '8px 20px',
            borderRadius: '6px', pointerEvents: 'none',
            display: 'none', letterSpacing: '3px',
        });
        this.criticalEl.textContent = t('alert');
        document.body.appendChild(this.criticalEl);

        this.gameOverEl = document.createElement('div');
        Object.assign(this.gameOverEl.style, {
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', zIndex: 20,
            font: 'bold 42px monospace', color: '#ff4444',
            textShadow: '0 2px 8px rgba(0,0,0,.8)',
            pointerEvents: 'none', display: 'none',
        });
        document.body.appendChild(this.gameOverEl);
    }

    update(player, noise) {
        const filled = Math.ceil(player.hp / 10);
        const hpBar = '█'.repeat(filled) + '░'.repeat(10 - filled);
        const stateLabel = t(`hud.state.${player.state}`);

        // --- Свой шум: база + свои импульсы ---
        let lines = '';
        lines += `HP ${hpBar} ${player.hp.toFixed(0)}\n`;
        lines += `dB ${noise.ownTotal.toFixed(1)}  ·  ${stateLabel}\n`;
        lines += `  база ${noise.base.toFixed(0)}\n`;
        for (const imp of noise.impulses) {
            if (imp.source !== 'player') continue;
            lines += `  ${imp.name} ${imp.level.toFixed(0)}\n`;
        }

        // --- Мировой шум вокруг (если слышно) ---
        const ambient = noise.ambientAtPlayer();
        if (ambient > 20) {
            lines += `вокруг ${ambient.toFixed(0)} dB\n`;
            for (const imp of noise.impulses) {
                if (imp.source === 'player') continue;
                lines += `  ${imp.name} (${imp.source})\n`;
                // Подсказка про debug
                if (!player.dead) {
                    lines += `\n[V] сенсоры зомби\n`;
                }
            }
        }

        this.el.textContent = lines;

        // Критический режим — только от СВОЕГО шума
        if (noise.critical) {
            this.criticalEl.style.display = 'block';
            const tm = performance.now() * 0.005;
            this.criticalEl.style.opacity = 0.6 + Math.sin(tm) * 0.4;
        } else {
            this.criticalEl.style.display = 'none';
        }
    }
}