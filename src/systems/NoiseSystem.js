// Система Шума: база от движения + импульсы от действий.
// Не знает про визуал — просто считает число dB.
import { NOISE } from '../config/noise.config.js';

export class NoiseSystem {
    constructor() {
        this.base = 0;      // текущий базовый шум
        this.impulse = 0;   // импульс (выстрел)
        this.total = 0;     // итог = base + impulse
    }

    // playerState — 'IDLE' | 'WALK' | 'SPRINT' | 'CROUCH'
    update(dt, playerState) {
        // Целевой уровень базового шума
        let target = 0;
        if (playerState === 'CROUCH') target = NOISE.base.crouch;
        else if (playerState === 'WALK') target = NOISE.base.walk;
        else if (playerState === 'SPRINT') target = NOISE.base.sprint;

        // Плавно идём к цели
        this.base += (target - this.base) * Math.min(1, dt * NOISE.lerpSpeed);

        // Импульс затухает сам
        this.impulse = Math.max(0, this.impulse - dt * NOISE.impulseDecay);

        this.total = Math.min(NOISE.max, this.base + this.impulse);
    }

    // Вызывается, когда игрок выстрелил
    addImpulse(amount = NOISE.impulseShot) {
        this.impulse += amount;
    }
}