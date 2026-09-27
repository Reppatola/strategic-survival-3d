// Зомби: идёт к последней громкой точке, атакует игрока вблизи.
import * as THREE from 'three';

const SPEED = 3.2;
const ATTACK_RANGE = 1.4;
const ATTACK_DAMAGE = 10;
const ATTACK_COOLDOWN = 1.0;
const HEAR_THRESHOLD = 45;

export class Zombie {
    constructor(x, z) {
        this.mesh = new THREE.Group();
        this.position = this.mesh.position;
        this.position.set(x, 0, z);

        this.alive = true;
        this.attackCooldown = 0;

        // Последняя услышанная громкая точка
        this.targetPos = new THREE.Vector3(x, 0, z);
        this.hasTarget = false;

        this._buildModel();
    }

    _buildModel() {
        const body = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.4, 0.8, 6, 12),
            new THREE.MeshStandardMaterial({ color: 0x6a9a4b, flatShading: true })
        );
        body.position.y = 0.9;
        body.castShadow = true;

        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x8ab86a, flatShading: true })
        );
        head.position.y = 1.65;
        head.castShadow = true;

        this.mesh.add(body, head);
    }

    // Возвращает урон, который зомби нанёс игроку за этот кадр (обычно 0)
    update(dt, playerPos, noiseLevel, playerDead, collision) {
        if (!this.alive) return 0;

        this.attackCooldown = Math.max(0, this.attackCooldown - dt);

        // --- Слух ---
        if (noiseLevel > HEAR_THRESHOLD) {
            const jitter = THREE.MathUtils.mapLinear(
                noiseLevel, HEAR_THRESHOLD, 110, 10, 2
            );
            this.targetPos.set(
                playerPos.x + (Math.random() - 0.5) * jitter,
                0,
                playerPos.z + (Math.random() - 0.5) * jitter
            );
            this.hasTarget = true;
        }

        // --- Движение к цели ---
        if (this.hasTarget) {
            const dx = this.targetPos.x - this.position.x;
            const dz = this.targetPos.z - this.position.z;
            const len = Math.hypot(dx, dz);

            if (len > 0.5) {
                const nx = this.position.x + (dx / len) * SPEED * dt;
                const nz = this.position.z + (dz / len) * SPEED * dt;
                collision.move(this.position, nx, nz);
                this.mesh.rotation.y = Math.atan2(dx, dz);
            } else {
                this.hasTarget = false;
            }
        }

        // --- Атака ---
        if (!playerDead) {
            const dpx = playerPos.x - this.position.x;
            const dpz = playerPos.z - this.position.z;
            const dist = Math.hypot(dpx, dpz);

            if (dist < ATTACK_RANGE && this.attackCooldown <= 0) {
                this.attackCooldown = ATTACK_COOLDOWN;
                return ATTACK_DAMAGE;
            }
        }

        return 0;
    }

    die() {
        this.alive = false;
        this.mesh.visible = false;
    }
}