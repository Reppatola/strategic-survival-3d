// Простой HUD: текст поверх экрана.
// Ничего не рисует на canvas — только DOM.
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
    }

    update(player, noise) {
        this.el.textContent =
            `dB ${noise.total.toFixed(0)}  ·  ${player.state}\n` +
            `прицел: ${player.position.x.toFixed(0)}, ${player.position.z.toFixed(0)}`;
    }
}