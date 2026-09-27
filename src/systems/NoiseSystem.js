// Система Шума — позиционная, физически честная.
//
// Каждый импульс помнит свои координаты. Уровень шума считается
// в КОНКРЕТНОЙ точке пространства: база игрока + все импульсы,
// каждый со своим затуханием с расстоянием.
//
// Формула: LΣ = 10·log10( Σ 10^(Lᵢ(d)/10) ),  Lᵢ(d) = L₀ − 20·log10(d)
import { NOISE } from '../config/noise.config.js';

export class NoiseSystem {
    constructor() {
        this.base = 0;
        this.impulses = [];         // { name, level, decay, x, z }
        this.total = 0;             // уровень НА ИГРОКЕ (для HUD, критики)
        this.critical = false;
        this.criticalTime = 0;
        this.justEnteredCritical = false;

        this._playerPos = { x: 0, z: 0 };  // кэш позиции игрока
    }

    // name — ключ из NOISE.impulses
    // x, z — координаты источника (null → берётся позиция игрока при расчёте)
    addImpulse(name, x = null, z = null) {
        const def = NOISE.impulses[name];
        if (!def) return;
        this.impulses.push({
            name: def.name,
            level: def.level,
            decay: def.decay,
            x, z,
        });
    }

    // playerState — 'IDLE' | 'WALK' | 'SPRINT' | 'CROUCH' | 'DEAD'
    // playerPos — { x, z } — для levelAtPoint и для позиционных импульсов
    update(dt, playerState, playerPos) {
        if (playerPos) this._playerPos = playerPos;

        // --- База ---
        let target = 0;
        if (playerState === 'CROUCH') target = NOISE.base.crouch;
        else if (playerState === 'WALK') target = NOISE.base.walk;
        else if (playerState === 'SPRINT') target = NOISE.base.sprint;

        this.base += (target - this.base) * Math.min(1, dt * NOISE.lerpSpeed);

        // --- Затухание импульсов: L(t) = L0 − k·t ---
        for (let i = this.impulses.length - 1; i >= 0; i--) {
            const imp = this.impulses[i];
            imp.level -= imp.decay * dt;
            if (imp.level <= NOISE.silentThreshold) {
                this.impulses.splice(i, 1);
            }
        }

        // --- Итог НА ИГРОКЕ (для HUD и критического режима) ---
        let energy = Math.pow(10, this.base / 10);
        for (const imp of this.impulses) {
            energy += Math.pow(10, imp.level / 10);
        }
        this.total = Math.min(NOISE.max, 10 * Math.log10(energy));

        // --- Гистерезис критического режима ---
        this.justEnteredCritical = false;
        if (!this.critical && this.total >= NOISE.criticalEnter) {
            this.critical = true;
            this.justEnteredCritical = true;
            this.criticalTime = 0;
        } else if (this.critical && this.total <= NOISE.criticalExit) {
            this.critical = false;
            this.criticalTime = 0;
        }
        if (this.critical) this.criticalTime += dt;
    }

    // Уровень шума В КОНКРЕТНОЙ ТОЧКЕ (px, pz).
    // База игрока — позиционная, от текущей позиции игрока.
    // Каждый импульс — от своей сохранённой точки.
    levelAtPoint(px, pz) {
        let energy = 0;

        // База игрока (шаги, бег) — от текущей позиции игрока
        if (this.base > 0.1) {
            const d = Math.max(1, Math.hypot(px - this._playerPos.x, pz - this._playerPos.z));
            const at = this.base - NOISE.distanceFalloff * Math.log10(d);
            if (at > 0) energy += Math.pow(10, at / 10);
        }

        // Импульсы — каждый от своей точки
        for (const imp of this.impulses) {
            const sx = imp.x !== null ? imp.x : this._playerPos.x;
            const sz = imp.z !== null ? imp.z : this._playerPos.z;
            const d = Math.max(1, Math.hypot(px - sx, pz - sz));
            const at = imp.level - NOISE.distanceFalloff * Math.log10(d);
            if (at > 0) energy += Math.pow(10, at / 10);
        }

        if (energy <= 0) return 0;
        return Math.min(NOISE.max, 10 * Math.log10(energy));
    }
}