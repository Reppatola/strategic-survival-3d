// Простой враг: идёт к цели (пока — к игроку).
// Позже добавим конусы обзора, состояния, реакции на шум.
import * as THREE from 'three';

const SPEED = 3.5;

export class Zombie {
    constructor(x, z) {
        this.mesh = new THREE.Group();
        this.position = this.mesh.position;
        this.position.set(x, 0, z);

        this.alive = true;

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

    update(dt, targetPos, collision) {
        if (!this.alive) return;

        const dx = targetPos.x - this.position.x;
        const dz = targetPos.z - this.position.z;
        const len = Math.hypot(dx, dz);
        if (len < 0.01) return;

        const nx = this.position.x + (dx / len) * SPEED * dt;
        const nz = this.position.z + (dz / len) * SPEED * dt;

        collision.move(this.position, nx, nz);

        // Смотрим на цель
        this.mesh.rotation.y = Math.atan2(dx, dz);
    }

    die() {
        this.alive = false;
        this.mesh.visible = false;
    }
}