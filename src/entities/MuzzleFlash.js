// Вспышка у дула оружия при выстреле.
// Просто PointLight, гаснет за ~0.15 сек.
import * as THREE from 'three';

export class MuzzleFlash {
    constructor(scene) {
        this.light = new THREE.PointLight(0xffdd88, 0, 18);
        scene.add(this.light);
    }

    // Позиция — Vector3 игрока, направление — {dx, dz}
    trigger(playerPos, dir) {
        this.light.position.set(
            playerPos.x + dir.dx * 0.8,
            1.2,
            playerPos.z + dir.dz * 0.8
        );
        this.light.intensity = 30;
    }

    update(dt) {
        this.light.intensity = Math.max(0, this.light.intensity - dt * 240);
    }
}