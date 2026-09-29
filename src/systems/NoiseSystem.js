// Система Шума — позиционная, физически честная.
//
// Источники шума:
//   1. base — сам игрок (движение)
//   2. impulses — разовые события (выстрел, удар)
//   3. zombieSources — активные зомби (CHASE / SEARCH)
//
// Формула: LΣ = 10·log10( Σ 10^(Lᵢ(d)/10) ),  Lᵢ(d) = L₀ − 20·log10(d)
import { NOISE } from '../config/noise.config.js';

export class NoiseSystem {
    constructor() {
        this.base = 0;
        this.impulses = [];
        this.zombieSources = new Map();   // id → { x, z, level }
        this.ownTotal = 0;
        this.critical = false;
        this.criticalTime = 0;
        this.justEnteredCritical = false;

        this._playerPos = { x: 0, z: 0 };
    }

    // --- Импульсы (выстрелы, удары) ---
    addImpulse(name, x = null, z = null, source = 'player') {
        const def = NOISE.impulses[name];
        if (!def) return;
        this.impulses.push({
            name: def.name,
            level: def.level,
            decay: def.decay,
            x, z, source,
        });
    }

    // --- Источники от зомби ---
    // Вызывается каждый кадр для каждого живого зомби.
    setZombieSource(id, x, z, level) {
        if (level <= 0.5) {
            this.zombieSources.delete(id);
            return;
        }
        this.zombieSources.set(id, { x, z, level });
    }

    clearZombieSources() {
        this.zombieSources.clear();
    }

    update(dt, playerState, playerPos) {
        if (playerPos) this._playerPos = playerPos;

        // База от движения игрока
        let target = 0;
        if (playerState === 'CROUCH') target = NOISE.base.crouch;
        else if (playerState === 'WALK') target = NOISE.base.walk;
        else if (playerState === 'SPRINT') target = NOISE.base.sprint;

        this.base += (target - this.base) * Math.min(1, dt * NOISE.lerpSpeed);

        // Затухание импульсов
        for (let i = this.impulses.length - 1; i >= 0; i--) {
            const imp = this.impulses[i];
            imp.level -= imp.decay * dt;
            if (imp.level <= NOISE.silentThreshold) this.impulses.splice(i, 1);
        }

        // ownTotal — только шум игрока (для HUD и критики)
        let ownEnergy = Math.pow(10, this.base / 10);
        for (const imp of this.impulses) {
            if (imp.source !== 'player') continue;
            ownEnergy += Math.pow(10, imp.level / 10);
        }
        this.ownTotal = Math.min(NOISE.max, 10 * Math.log10(ownEnergy));

        // Гистерезис критики
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

    // Полный шум в точке (игрок + импульсы + зомби-источники)
    levelAtPoint(px, pz) {
        let energy = 0;

        if (this.base > 0.1) {
            const d = Math.max(1, Math.hypot(px - this._playerPos.x, pz - this._playerPos.z));
            const at = this.base - NOISE.distanceFalloff * Math.log10(d);
            if (at > 0) energy += Math.pow(10, at / 10);
        }

        for (const imp of this.impulses) {
            const sx = imp.x !== null ? imp.x : this._playerPos.x;
            const sz = imp.z !== null ? imp.z : this._playerPos.z;
            const d = Math.max(1, Math.hypot(px - sx, pz - sz));
            const at = imp.level - NOISE.distanceFalloff * Math.log10(d);
            if (at > 0) energy += Math.pow(10, at / 10);
        }

        for (const s of this.zombieSources.values()) {
            const d = Math.max(1, Math.hypot(px - s.x, pz - s.z));
            const at = s.level - NOISE.distanceFalloff * Math.log10(d);
            if (at > 0) energy += Math.pow(10, at / 10);
        }

        if (energy <= 0) return 0;
        return Math.min(NOISE.max, 10 * Math.log10(energy));
    }

    // Самый громкий источник в точке (px, pz) — куда идти зомби
    dominantSourceAt(px, pz) {
        let best = null;
        let bestLevel = 0;

        if (this.base > 0.1) {
            const d = Math.max(1, Math.hypot(px - this._playerPos.x, pz - this._playerPos.z));
            const at = this.base - NOISE.distanceFalloff * Math.log10(d);
            if (at > bestLevel) {
                bestLevel = at;
                best = { x: this._playerPos.x, z: this._playerPos.z, level: at, kind: 'player' };
            }
        }

        for (const imp of this.impulses) {
            const sx = imp.x !== null ? imp.x : this._playerPos.x;
            const sz = imp.z !== null ? imp.z : this._playerPos.z;
            const d = Math.max(1, Math.hypot(px - sx, pz - sz));
            const at = imp.level - NOISE.distanceFalloff * Math.log10(d);
            if (at > bestLevel) {
                bestLevel = at;
                best = { x: sx, z: sz, level: at, kind: 'impulse' };
            }
        }

        for (const s of this.zombieSources.values()) {
            const d = Math.max(1, Math.hypot(px - s.x, pz - s.z));
            const at = s.level - NOISE.distanceFalloff * Math.log10(d);
            if (at > bestLevel) {
                bestLevel = at;
                best = { x: s.x, z: s.z, level: at, kind: 'zombie' };
            }
        }

        return best;
    }

    // Слышимый извне шум (без собственной базы) — для HUD
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

        for (const s of this.zombieSources.values()) {
            const d = Math.max(1, Math.hypot(this._playerPos.x - s.x, this._playerPos.z - s.z));
            const at = s.level - NOISE.distanceFalloff * Math.log10(d);
            if (at > 0) energy += Math.pow(10, at / 10);
        }

        return energy > 0 ? 10 * Math.log10(energy) : 0;
    }
}