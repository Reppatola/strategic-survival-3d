// Проверяет столкновения и умеет «скользить» вдоль стен.
// Временно — простой AABB. Позже заменим на что-то более умное.
import { PLAYER } from '../config/player.config.js';

export class CollisionSystem {
    constructor() {
        this.obstacles = []; // { x, z, w, d }
    }

    registerBox(x, z, w, d) {
        this.obstacles.push({ x, z, w, d });
    }

    isBlocked(x, z) {
        const R = PLAYER.radius;
        for (const o of this.obstacles) {
            if (Math.abs(x - o.x) < o.w / 2 + R &&
                Math.abs(z - o.z) < o.d / 2 + R) return true;
        }
        return false;
    }

    // Пробует поставить объект в (nx, nz), при столкновении скользит по оси.
    move(position, nx, nz) {
        if (!this.isBlocked(nx, nz)) {
            position.x = nx;
            position.z = nz;
            return;
        }
        if (!this.isBlocked(nx, position.z)) { position.x = nx; return; }
        if (!this.isBlocked(position.x, nz)) { position.z = nz; }
    }

    // Проверяет, перекрыт ли отрезок между двумя точками зданием.
    // Используем для видимости: если между зомби и игроком есть стена — не видит.
    lineBlocked(x1, z1, x2, z2, samples = 20) {
        for (let i = 1; i < samples; i++) {
            const t = i / samples;
            const x = x1 + (x2 - x1) * t;
            const z = z1 + (z2 - z1) * t;
            if (this.isBlocked(x, z)) return true;
        }
        return false;
    }
}