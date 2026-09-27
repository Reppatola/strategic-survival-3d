// Превращает позицию мыши на экране в точку на земле (y=0).
// Отвечает ТОЛЬКО за это.
import * as THREE from 'three';

export class AimSystem {
    constructor(camera) {
        this.camera = camera;
        this.raycaster = new THREE.Raycaster();
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.aimPoint = new THREE.Vector3();
    }

    // mouseNDC — {x, y} из InputSystem. Обновляет this.aimPoint.
    update(mouseNDC) {
        this.raycaster.setFromCamera(mouseNDC, this.camera);
        this.raycaster.ray.intersectPlane(this.groundPlane, this.aimPoint);
        return this.aimPoint;
    }
}