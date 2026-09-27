// Зомби: реагирует на шум, если тот дошёл до него.
// Слышимость зависит от расстояния: L(d) = L0 − 20·log10(d).
import * as THREE from 'three';
import { NOISE } from '../config/noise.config.js';

const SPEED = 3.2;
const ATTACK_RANGE = 1.4;
const ATTACK_DAMAGE = 10;
const ATTACK_COOLDOWN = 1.0;

export class Zombie {
    constructor(x, z) {
        this.mesh = new THREE.Group();
        this.position = this.mesh.position;
        this.position.set(x, 0, z);

        this.alive = true;
        this.attackCooldown = 0;

        this.targetPos = new THREE.Vector3(x, 0, z);
        this.hasTarget = false;
        this.lastHeardLevel = 0;

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

    // noiseSystem — ссылка на NoiseSystem, чтобы спросить levelAt(distance)
    update(dt, playerPos, noiseSystem, playerDead, collision) {
        if (!this.alive) return 0;

        this.attackCooldown = Math.max(0, this.attackCooldown - dt);

        // --- Слух: сколько dB дошло именно до этого зомби ---
        const distToPlayer = Math.hypot(
            playerPos.x - this.position.x,
            playerPos.z - this.position.z
        );
        const heard = noiseSystem.levelAt(distToPlayer);
        this.lastHeardLevel = heard;

        if (heard > NOISE.hearingThreshold) {
            // Чем сильнее слышно — тем точнее идёт.
            // heard от 18 (порог) до 100+ (выстрел рядом)
            const jitter = THREE.MathUtils.mapLinear(
                Math.min(heard, 110), 18, 110, 15, 1.5
            );
            this.targetPos.set(
                playerPos.x + (Math.random() - 0.5) * jitter,
                0,
                playerPos.z + (Math.random() - 0.5) * jitter
            );
            this.hasTarget = true;
        }

        // --- Движение ---
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
        if (!playerDead && distToPlayer < ATTACK_RANGE && this.attackCooldown <= 0) {
            this.attackCooldown = ATTACK_COOLDOWN;
            return ATTACK_DAMAGE;
        }

        return 0;
    }

    die() {
        this.alive = false;
        this.mesh.visible = false;
    }
}