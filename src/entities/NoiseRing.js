// Кольцо шума на земле под игроком.
// Радиус и цвет зависят от текущего dB.
import * as THREE from 'three';

export class NoiseRing {
    constructor(scene) {
        const geo = new THREE.RingGeometry(0.93, 1.0, 80);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x66ff99,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 0.06;
        scene.add(this.mesh);
    }

    update(playerPos, noiseLevel, playerDead) {
        this.mesh.visible = !playerDead;
        if (playerDead) return;

        const radius = 2 + noiseLevel * 0.24;
        this.mesh.position.x = playerPos.x;
        this.mesh.position.z = playerPos.z;
        this.mesh.scale.setScalar(radius);

        const t = Math.min(1, noiseLevel / 110);
        this.mesh.material.opacity = 0.12 + t * 0.4;
        this.mesh.material.color.setHSL(0.35 - t * 0.35, 0.9, 0.55);
    }
}