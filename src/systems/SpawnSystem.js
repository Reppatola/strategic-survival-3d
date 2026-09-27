// Спавнит зомби разных типов, обновляет их, возвращает урон игроку.
import { Zombie } from '../entities/Zombie.js';

export class SpawnSystem {
    constructor(scene, collision) {
        this.scene = scene;
        this.collision = collision;
        this.zombies = [];
    }

    spawnOne(x, z, typeKey) {
        if (this.collision.isBlocked(x, z)) return null;
        const z0 = new Zombie(x, z, typeKey);
        this.scene.add(z0.mesh);
        this.zombies.push(z0);
        return z0;
    }

    spawnRing(centerPos, count, minR = 40, maxR = 80, typeKey = 'walker') {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = minR + Math.random() * (maxR - minR);
            this.spawnOne(centerPos.x + Math.cos(a) * r, centerPos.z + Math.sin(a) * r, typeKey);
        }
    }

    // Смешанный спавн: walker'ы + по одному каждого спеца
    spawnMixed(centerPos) {
        this.spawnRing(centerPos, 6, 40, 80, 'walker');
        this.spawnRing(centerPos, 1, 50, 70, 'sniffer');
        this.spawnRing(centerPos, 1, 50, 70, 'listener');
        this.spawnRing(centerPos, 1, 60, 80, 'screamer');
    }

    update(dt, playerPos, noiseSystem, playerDead, collision, bullets) {
        let damageToPlayer = 0;

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

            // Крик крикуна — глобальный шум через noiseSystem
            if (z.didScream) {
                noiseSystem.addImpulse('scream');
            }

            const dmg = z.update(dt, playerPos, noiseSystem, playerDead, collision);
            damageToPlayer += dmg;
        }

        return damageToPlayer;
    }
}