// Главное меню: Играть / Переиграть / Выход.
// DOM-overlay поверх canvas. Стиль — monospace, в тон HUD.
export class MainMenu {
    constructor({ onPlay, onRestart, onExit }) {
        this.onPlay = onPlay;
        this.onRestart = onRestart;
        this.onExit = onExit;
        this.visible = false;

        this.el = document.createElement('div');
        Object.assign(this.el.style, {
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(4px)',
            fontFamily: 'monospace',
            color: '#fff',
            transition: 'opacity 0.2s ease',
        });

        // Заголовок
        const title = document.createElement('div');
        Object.assign(title.style, {
            fontSize: '42px',
            fontWeight: 'bold',
            letterSpacing: '6px',
            marginBottom: '8px',
            textShadow: '0 2px 12px rgba(0,0,0,.8)',
        });
        title.textContent = 'STRATEGIC SURVIVAL';

        // Подзаголовок
        const subtitle = document.createElement('div');
        Object.assign(subtitle.style, {
            fontSize: '14px',
            letterSpacing: '3px',
            opacity: 0.6,
            marginBottom: '48px',
        });
        subtitle.textContent = '3D · twin-stick survival';

        this.el.append(title, subtitle);

        // Кнопки
        this.playBtn    = this._makeButton('ИГРАТЬ',    () => this._handle('play'));
        this.restartBtn = this._makeButton('ПЕРЕИГРАТЬ', () => this._handle('restart'));
        this.exitBtn    = this._makeButton('ВЫХОД',     () => this._handle('exit'));

        this.el.append(this.playBtn, this.restartBtn, this.exitBtn);

        // Подсказка снизу
        const hint = document.createElement('div');
        Object.assign(hint.style, {
            position: 'absolute', bottom: '32px',
            fontSize: '12px', letterSpacing: '2px',
            opacity: 0.4,
        });
        hint.textContent = 'WASD · Мышь · ЛКМ · Q · E · F · V';
        this.el.appendChild(hint);

        document.body.appendChild(this.el);
        this.hide();
    }

    _makeButton(label, handler) {
        const btn = document.createElement('button');
        Object.assign(btn.style, {
            width: '260px',
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
            e.stopPropagation(); // чтобы клик не «прошёл» в игру
            handler();
        });

        btn.textContent = label;
        return btn;
    }

    _handle(action) {
        if (action === 'play'    && this.onPlay)    this.onPlay();
        if (action === 'restart' && this.onRestart) this.onRestart();
        if (action === 'exit'    && this.onExit)    this.onExit();
    }

    show() {
        this.visible = true;
        this.el.style.display = 'flex';
        this.el.style.opacity = '1';
    }

    hide() {
        this.visible = false;
        this.el.style.display = 'none';
    }

    // Показать состояние «игрок погиб»: подсветить «Переиграть»
    focusRestart() {
        this.restartBtn.style.borderColor = 'rgba(255, 80, 80, 0.9)';
        this.restartBtn.style.background = 'rgba(255, 80, 80, 0.15)';
    }

    // Вернуть обычный вид (при старте игры)
    unfocusRestart() {
        this.restartBtn.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        this.restartBtn.style.background = 'rgba(255, 255, 255, 0.08)';
    }
}