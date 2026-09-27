// Система Шума — позиционная, физически честная.
//
// Разделяет два слоя:
//   - ownTotal:  собственный шум ИГРОКА (база + свои импульсы) → в HUD, критика
//   - levelAtPoint(px, pz):  полный шум в точке (свой + мировой) → для AI зомби
//
// Импульсы помечаются source: 'player' | 'world'.
import { NOISE } from '../config/noise.config.js';

export class NoiseSystem {
    constructor() {
        this.base = 0;
        this.impulses = [];   // { name, level, decay, x, z, source }
        this.ownTotal = 0;    // шум самого игрока (для HUD и критики)
        this.critical = false;
        this.criticalTime = 0;
        this.justEnteredCritical = false;

        this._playerPos = { x: 0, z: 0 };
    }

    // source: 'player' (по умолчанию) | 'world'
    addImpulse(name, x = null, z = null, source = 'player') {
        const def = NOISE.impulses[name];
        if (!def) return;
        this.impulses.push({
            name: def.name,
            level: def.level,
            decay: def.decay,
            x, z,
            source,
        });
    }

    update(dt, playerState, playerPos) {
        if (playerPos) this._playerPos = playerPos;

        // --- База от движения игрока ---
        let target = 0;
        if (playerState === 'CROUCH') target = NOISE.base.crouch;
        else if (playerState === 'WALK') target = NOISE.base.walk;
        else if (playerState === 'SPRINT') target = NOISE.base.sprint;

        this.base += (target - this.base) * Math.min(1, dt * NOISE.lerpSpeed);

        // --- Затухание импульсов ---
        for (let i = this.impulses.length - 1; i >= 0; i--) {
            const imp = this.impulses[i];
            imp.level -= imp.decay * dt;
            if (imp.level <= NOISE.silentThreshold) this.impulses.splice(i, 1);
        }

        // --- Собственный шум игрока: база + свои импульсы ---
        let ownEnergy = Math.pow(10, this.base / 10);
        for (const imp of this.impulses) {
            if (imp.source !== 'player') continue;
            ownEnergy += Math.pow(10, imp.level / 10);
        }
        this.ownTotal = Math.min(NOISE.max, 10 * Math.log10(ownEnergy));

        // --- Критический режим — только от СВОЕГО шума ---
        this.justEnteredCritical = false;
        if (!this.critical && this.ownTotal >= NOISE.criticalEnter) {
            this.critical = true;
            this.justEnteredCritical = true;
            this.criticalTime = 0;
        } else if (this.critical && this.ownTotal <= NOISE.criticalExit) {
            this.critical = false;
            this.criticalTime = 0;
        }
        if (this.critical) this.criticalTime += dt;
    }

    // Полный шум в точке (свой + мировой).
    levelAtPoint(px, pz) {
        let energy = 0;

        // База игрока
        if (this.base > 0.1) {
            const d = Math.max(1, Math.hypot(px - this._playerPos.x, pz - this._playerPos.z));
            const at = this.base - NOISE.distanceFalloff * Math.log10(d);
            if (at > 0) energy += Math.pow(10, at / 10);
        }

        // Все импульсы (и свои, и мировые)
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

    // Слышимый игроком шум извне (без его собственной базы).
    // Для HUD-строки «слышно вокруг».
    ambientAtPlayer() {
        let energy = 0;
        for (const imp of this.impulses) {
            if (imp.source === 'player') continue;
            const sx = imp.x !== null ? imp.x : this._playerPos.x;
            const sz = imp.z !== null ? imp.z : this._playerPos.z;
            const d = Math.max(1, Math.hypot(this._playerPos.x - sx, this._playerPos.z - sz));
            const at = imp.level - NOISE.distanceFalloff * Math.log10(d);
            if (at > 0) energy += Math.pow(10, at / 10);
        }
        return energy > 0 ? 10 * Math.log10(energy) : 0;
    }
}