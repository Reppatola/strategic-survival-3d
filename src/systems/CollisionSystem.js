// Проверяет столкновения и умеет «скользить» вдоль стен.
// move() возвращает true, если позиция реально сдвинулась.
import { PLAYER } from '../config/player.config.js';

export class CollisionSystem {
    constructor() {
        this.obstacles = []; // { x, z, w, d }
    }

    registerBox(x, z, w, d) {
        this.obstacles.push({ x, z, w, d });
    }

    isBlocked(x, z, radius = PLAYER.radius) {
        for (const o of this.obstacles) {
            if (Math.abs(x - o.x) < o.w / 2 + radius &&
                Math.abs(z - o.z) < o.d / 2 + radius) return true;
        }
        return false;
    }

    // Пробует поставить объект в (nx, nz). При столкновении скользит по оси.
    // Возвращает true, если реально сдвинулся хотя бы на 0.001.
    move(position, nx, nz) {
        const startX = position.x;
        const startZ = position.z;

        if (!this.isBlocked(nx, nz)) {
            position.x = nx;
            position.z = nz;
        } else if (!this.isBlocked(nx, position.z)) {
            position.x = nx;
        } else if (!this.isBlocked(position.x, nz)) {
            position.z = nz;
        }

        const dx = position.x - startX;
        const dz = position.z - startZ;
        return (dx * dx + dz * dz) > 1e-6;
    }

    // Проверяет, перекрыт ли отрезок между двумя точками зданием.
    // Ранний отсев по bounding box — не гоняем пересечения, если
    // ни одно здание даже не пересекает прямоугольник отрезка.
    lineBlocked(x1, z1, x2, z2, samples = 20) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minZ = Math.min(z1, z2);
        const maxZ = Math.max(z1, z2);

        // Ранний отсев: есть ли вообще кандидаты?
        let anyCandidate = false;
        for (const o of this.obstacles) {
            if (o.x + o.w / 2 < minX || o.x - o.w / 2 > maxX) continue;
            if (o.z + o.d / 2 < minZ || o.z - o.d / 2 > maxZ) continue;
            anyCandidate = true;
            break;
        }
        if (!anyCandidate) return false;

        // Точная проверка сэмплами
        for (let i = 1; i < samples; i++) {
            const t = i / samples;
            const x = x1 + (x2 - x1) * t;
            const z = z1 + (z2 - z1) * t;
            if (this.isBlocked(x, z, 0)) return true;
        }
        return false;
    }
}