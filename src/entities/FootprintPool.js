// Пул следов от шагов. Каждый след — маленький тёмный кружок,
// который медленно исчезает через ~1.5 секунды.
import * as THREE from 'three';

const LIFETIME = 1.5;
const SIZE = 32;

export class FootprintPool {
    constructor(scene) {
        this.scene = scene;
        this.idx = 0;

        const geo = new THREE.CircleGeometry(0.28, 12);
        this.items = [];

        for (let i = 0; i < SIZE; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: 0x2c4a22,
                transparent: true,
                opacity: 0,
                depthWrite: false,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = 0.03;
            mesh.visible = false;
            scene.add(mesh);
            this.items.push({ mesh, life: 0 });
        }
    }

    spawn(x, z) {
        const s = this.items[this.idx++ % SIZE];
        s.mesh.position.set(
            x + (Math.random() - 0.5) * 0.3,
            0.03,
            z + (Math.random() - 0.5) * 0.3
        );
        s.mesh.visible = true;
        s.mesh.scale.setScalar(1);
        s.life = LIFETIME;
    }

    update(dt) {
        for (const s of this.items) {
            if (!s.mesh.visible) continue;
            s.life -= dt;
            if (s.life <= 0) {
                s.mesh.visible = false;
                s.mesh.material.opacity = 0;
                continue;
            }
            s.mesh.material.opacity = (s.life / LIFETIME) * 0.5;
            s.mesh.scale.setScalar(1 + (1 - s.life / LIFETIME) * 1.5);
        }
    }
}