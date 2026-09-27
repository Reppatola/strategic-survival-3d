// Прицел на земле: кольцо в точке прицела + луч от игрока.
// Чисто визуальный эффект.
import * as THREE from 'three';

export class Crosshair {
    constructor(scene) {
        this.scene = scene;

        // Кольцо на земле
        const ringGeo = new THREE.RingGeometry(0.5, 0.65, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        this.ring = new THREE.Mesh(ringGeo, ringMat);
        this.ring.rotation.x = -Math.PI / 2;
        this.ring.position.y = 0.05;
        scene.add(this.ring);

        // Внутренняя точка
        const dotGeo = new THREE.CircleGeometry(0.12, 16);
        const dotMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
        });
        this.dot = new THREE.Mesh(dotGeo, dotMat);
        this.dot.rotation.x = -Math.PI / 2;
        this.dot.position.y = 0.06;
        scene.add(this.dot);

        // Луч от игрока к прицелу (тонкая полоска на земле)
        const rayGeo = new THREE.PlaneGeometry(1, 0.08);
        const rayMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        this.ray = new THREE.Mesh(rayGeo, rayMat);
        this.ray.rotation.x = -Math.PI / 2;
        this.ray.position.y = 0.04;
        scene.add(this.ray);
    }

    update(playerPos, aimPoint, playerDead) {
        // Скрываем прицел, если игрок мёртв
        const visible = !playerDead;
        this.ring.visible = visible;
        this.dot.visible = visible;
        this.ray.visible = visible;
        if (!visible) return;

        // Кольцо и точка — в точке прицела
        this.ring.position.x = aimPoint.x;
        this.ring.position.z = aimPoint.z;
        this.dot.position.x = aimPoint.x;
        this.dot.position.z = aimPoint.z;

        // Вращаем кольцо — оно «дышит»
        this.ring.rotation.z += 0.02;

        // Луч — от игрока до прицела
        const dx = aimPoint.x - playerPos.x;
        const dz = aimPoint.z - playerPos.z;
        const len = Math.hypot(dx, dz);

        if (len > 0.5) {
            this.ray.position.x = playerPos.x + dx / 2;
            this.ray.position.z = playerPos.z + dz / 2;
            this.ray.scale.x = len;
            this.ray.rotation.z = -Math.atan2(dz, dx);
        }
    }
}