// Игрок: модель, движение по 8 направлениям, поворот, стрельба, HP.
import * as THREE from 'three';
import { PLAYER } from '../config/player.config.js';
import { GAME } from '../config/game.config.js';

export class Player {
    constructor() {
        this.mesh = new THREE.Group();
        this.position = this.mesh.position;

        this._buildModel();

        this.state = 'IDLE';
        this.aimLen = 0;

        // Стрельба
        this._fireCooldown = 0;
        this.didShoot = false;
        this._shotDir = { dx: 0, dz: 1 };

        // Здоровье
        this.hp = 100;
        this.maxHp = 100;
        this.dead = false;
        this._invulnTimer = 0;
    }

    _buildModel() {
        const body = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.45, 0.9, 6, 12),
            new THREE.MeshStandardMaterial({ color: 0xffcf5a, flatShading: true })
        );
        body.position.y = 1.0;
        body.castShadow = true;

        const visor = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.18, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x222831 })
        );
        visor.position.set(0, 1.45, 0.38);

        const gun = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.16, 0.9),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        gun.position.set(0.4, 1.0, 0.3);

        this.mesh.add(body, visor, gun);
    }

    takeDamage(amount) {
        if (this.dead || this._invulnTimer > 0) return;
        this.hp = Math.max(0, this.hp - amount);
        this._invulnTimer = 0.4;
        if (this.hp <= 0) this.dead = true;
    }

    update(dt, input, aimPoint, collision) {
        this._invulnTimer = Math.max(0, this._invulnTimer - dt);
        this._fireCooldown = Math.max(0, this._fireCooldown - dt);

        // Мёртвый игрок не двигается и не стреляет
        if (this.dead) {
            this.state = 'DEAD';
            this.didShoot = false;
            return;
        }

        // --- Прицел ---
        const ax = aimPoint.x - this.position.x;
        const az = aimPoint.z - this.position.z;
        this.aimLen = Math.hypot(ax, az);

        // --- Поворот к прицелу ---
        if (this.aimLen > 0.5) {
            const target = Math.atan2(ax, az);
            this.mesh.rotation.y += this._shortestAngle(this.mesh.rotation.y, target) * Math.min(1, dt * 16);
        }

        // --- Движение (8 направлений) ---
        if (input.moving) {
            const len = Math.hypot(input.ix, input.iz);
            const dx = input.ix / len;
            const dz = input.iz / len;
            const speed = input.crouch ? PLAYER.speeds.crouch
                        : input.sprint ? PLAYER.speeds.sprint
                        : PLAYER.speeds.walk;

            const nx = THREE.MathUtils.clamp(this.position.x + dx * speed * dt, -GAME.worldHalf, GAME.worldHalf);
            const nz = THREE.MathUtils.clamp(this.position.z + dz * speed * dt, -GAME.worldHalf, GAME.worldHalf);

            collision.move(this.position, nx, nz);

            this.state = input.crouch ? 'CROUCH' : input.sprint ? 'SPRINT' : 'WALK';
        } else {
            this.state = 'IDLE';
        }

        // --- Стрельба ---
        this.didShoot = false;
        if (input.fire && this._fireCooldown <= 0 && this.aimLen > 0.5) {
            this._shotDir.dx = ax / this.aimLen;
            this._shotDir.dz = az / this.aimLen;
            this.didShoot = true;
            this._fireCooldown = 0.16;
        }
    }

    _shortestAngle(from, to) {
        let d = (to - from) % (Math.PI * 2);
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        return d;
    }
}