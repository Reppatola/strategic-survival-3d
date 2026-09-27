// Игрок: модель, движение по 8 направлениям, поворот, стрельба.
// Не знает о камере и шуме — Game позже спросит его состояние.
import * as THREE from 'three';
import { PLAYER } from '../config/player.config.js';
import { GAME } from '../config/game.config.js';

export class Player {
    constructor() {
        this.mesh = new THREE.Group();
        this.position = this.mesh.position;

        this._buildModel();

        // Состояние для других систем
        this.state = 'IDLE';
        this.aimLen = 0;
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

        this.mesh.add(body, visor);
    }

    // input — из InputSystem, aimPoint — из AimSystem, collision — из CollisionSystem
    update(dt, input, aimPoint, collision) {
        // --- Поворот к прицелу (twin-stick) ---
        const ax = aimPoint.x - this.position.x;
        const az = aimPoint.z - this.position.z;
        this.aimLen = Math.hypot(ax, az);

        if (this.aimLen > 0.5) {
            const target = Math.atan2(ax, az);
            this.mesh.rotation.y += this._shortestAngle(this.mesh.rotation.y, target) * Math.min(1, dt * 16);
        }

        // --- Движение ---
        let target = 0;
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
            target = input.crouch ? 30 : input.sprint ? 70 : 50;
        } else {
            this.state = 'IDLE';
        }
    }

    _shortestAngle(from, to) {
        let d = (to - from) % (Math.PI * 2);
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        return d;
    }
}