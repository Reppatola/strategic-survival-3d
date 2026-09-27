// Пока простой: спавнит N зомби в случайных точках вокруг игрока.
// Позже: волны, лимиты, реакция на шум.
import { Zombie } from '../entities/Zombie.js';

export class SpawnSystem {
    constructor(scene, collision) {
        this.scene = scene;
        this.collision = collision;
        this.zombies = [];
    }

    spawnRing(centerPos, count, minR = 40, maxR = 80) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = minR + Math.random() * (maxR - minR);
            const x = centerPos.x + Math.cos(a) * r;
            const z = centerPos.z + Math.sin(a) * r;

            if (this.collision.isBlocked(x, z)) continue;

            const z0 = new Zombie(x, z);
            this.scene.add(z0.mesh);
            this.zombies.push(z0);
        }
    }

    update(dt, targetPos, collision, bullets) {
        for (const z of this.zombies) {
            if (!z.alive) continue;

            // Попадание пули
            for (const b of bullets.items) {
                if (!b.mesh.visible) continue;
                const dx = b.mesh.position.x - z.position.x;
                const dz = b.mesh.position.z - z.position.z;
                if (dx * dx + dz * dz < 0.6 * 0.6) {
                    b.mesh.visible = false;
                    z.die();
                    break;
                }
            }

            z.update(dt, targetPos, collision);
        }
    }
}