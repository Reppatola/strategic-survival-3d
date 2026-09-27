// Система Шума — физически честная модель.
// LΣ = 10·log10( Σ 10^(Li/10) )
// Плюс затухание с расстоянием: L(d) = L0 − 20·log10(d)
import { NOISE } from '../config/noise.config.js';

export class NoiseSystem {
    constructor() {
        this.base = 0;
        this.impulses = [];
        this.total = 0;
        this.critical = false;
        this.criticalTime = 0;
        this.justEnteredCritical = false;
    }

    addImpulse(name) {
        const def = NOISE.impulses[name];
        if (!def) return;
        this.impulses.push({
            name: def.name,
            level: def.level,
            decay: def.decay,
        });
    }

    update(dt, playerState) {
        let target = 0;
        if (playerState === 'CROUCH') target = NOISE.base.crouch;
        else if (playerState === 'WALK') target = NOISE.base.walk;
        else if (playerState === 'SPRINT') target = NOISE.base.sprint;

        this.base += (target - this.base) * Math.min(1, dt * NOISE.lerpSpeed);

        for (let i = this.impulses.length - 1; i >= 0; i--) {
            const imp = this.impulses[i];
            imp.level -= imp.decay * dt;
            if (imp.level <= NOISE.silentThreshold) {
                this.impulses.splice(i, 1);
            }
        }

        let energy = Math.pow(10, this.base / 10);
        for (const imp of this.impulses) {
            energy += Math.pow(10, imp.level / 10);
        }
        this.total = Math.min(NOISE.max, 10 * Math.log10(energy));

        const wasCritical = this.critical;
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

    // Сколько dB дошло до точки на расстоянии `distance` метров от источника.
    // L(d) = L0 − 20·log10(d), d0 = 1 м
    levelAt(distance) {
        if (distance < 1) distance = 1;
        const attenuation = NOISE.distanceFalloff * Math.log10(distance);
        return this.total - attenuation;
    }
}