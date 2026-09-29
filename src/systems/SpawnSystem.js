import * as THREE from 'three';
import { Zombie } from '../entities/Zombie.js';
import { GAME } from '../config/game.config.js';

export class SpawnSystem {
    constructor(scene, collision) {
        this.scene = scene;
        this.collision = collision;
        this.zombies = [];
        this._nextId = 1;
    }

    spawnOne(x, z, typeKey) {
        x = THREE.MathUtils.clamp(x, -GAME.worldHalf + 5, GAME.worldHalf - 5);
        z = THREE.MathUtils.clamp(z, -GAME.worldHalf + 5, GAME.worldHalf - 5);

        if (this.collision.isBlocked(x, z)) return null;
        const id = 'z_' + (this._nextId++);
        const z0 = new Zombie(x, z, typeKey, id);
        this.scene.add(z0.mesh);
        this.zombies.push(z0);
        return z0;
    }

    spawnRing(centerPos, count, minR = 40, maxR = 80, typeKey = 'walker') {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = minR + Math.random() * (maxR - minR);
            this.spawnOne(
                centerPos.x + Math.cos(a) * r,
                centerPos.z + Math.sin(a) * r,
                typeKey
            );
        }
    }

    spawnMixed(centerPos) {
        this.spawnRing(centerPos, 6, 40, 80, 'walker');
        this.spawnRing(centerPos, 1, 50, 70, 'sniffer');
        this.spawnRing(centerPos, 1, 50, 70, 'listener');
        this.spawnRing(centerPos, 1, 60, 80, 'screamer');
    }

    update(dt, playerPos, noiseSystem, playerDead, collision, bullets, smellTrail) {
        // 1. Очистить прошлые источники шума
        noiseSystem.clearZombieSources();

        // 2. Собрать агрессивных
        const aggressive = [];
        for (const z of this.zombies) {
            if (!z.alive) continue;
            if (z.state === 'CHASE') aggressive.push(z);
            noiseSystem.setZombieSource(z.id, z.position.x, z.position.z, z.noiseLevel);
        }

        // 3. Обновить AI
        let damageToPlayer = 0;

        for (const z of this.zombies) {
            if (!z.alive) continue;

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

            const dmg = z.update(dt, playerPos, noiseSystem, playerDead, collision, aggressive, smellTrail);
            damageToPlayer += dmg;
        }

        return damageToPlayer;
    }
}