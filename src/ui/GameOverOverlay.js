// Экран победы / смерти с кнопками.
// Отдельно от MainMenu — другой контекст.
import { t } from '../i18n/index.js';

export class GameOverOverlay {
    constructor({ onRestart, onMenu }) {
        this.onRestart = onRestart;
        this.onMenu = onMenu;

        this.el = document.createElement('div');
        Object.assign(this.el.style, {
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'none', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(4px)',
            fontFamily: 'monospace',
            color: '#fff',
            transition: 'opacity 0.2s ease',
        });

        this.titleEl = document.createElement('div');
        Object.assign(this.titleEl.style, {
            fontSize: '56px',
            fontWeight: 'bold',
            letterSpacing: '8px',
            marginBottom: '8px',
            textShadow: '0 2px 12px rgba(0,0,0,.8)',
        });

        this.subEl = document.createElement('div');
        Object.assign(this.subEl.style, {
            fontSize: '14px',
            letterSpacing: '2px',
            opacity: 0.7,
            marginBottom: '48px',
        });

        this.el.append(this.titleEl, this.subEl);

        this.restartBtn = this._makeButton(t('restart'), () => {
            if (this.onRestart) this.onRestart();
        });
        this.menuBtn = this._makeButton(t('backToMenu'), () => {
            if (this.onMenu) this.onMenu();
        });

        this.el.append(this.restartBtn, this.menuBtn);
        document.body.appendChild(this.el);
    }

    _makeButton(label, handler) {
        const btn = document.createElement('button');
        Object.assign(btn.style, {
            width: '280px',
            padding: '14px 24px',
            margin: '6px 0',
            fontFamily: 'monospace',
            fontSize: '16px',
            letterSpacing: '4px',
            color: '#fff',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
        });
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(255, 255, 255, 0.18)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.6)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(255, 255, 255, 0.08)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        });
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handler();
        });
        btn.textContent = label;
        return btn;
    }

    // win: true — победа, false — смерть
    show({ win }) {
        if (win) {
            this.titleEl.textContent = t('victory');
            this.titleEl.style.color = '#66ff99';
            this.subEl.textContent = t('victorySub');
            this.restartBtn.style.display = 'none';
        } else {
            this.titleEl.textContent = t('gameOver');
            this.titleEl.style.color = '#ff4444';
            this.subEl.textContent = t('gameOverSub');
            this.restartBtn.style.display = 'block';
        }
        this.el.style.display = 'flex';
    }

    hide() {
        this.el.style.display = 'none';
    }
}