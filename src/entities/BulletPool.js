// Пул пуль. Переиспользуем одни и те же меши — не аллоцируем каждый выстрел.
import * as THREE from 'three';

const BULLET_SPEED = 42;
const BULLET_LIFE  = 0.7;

export class BulletPool {
    constructor(scene, size = 24) {
        this.scene = scene;
        this.size = size;
        this.idx = 0;

        const geo = new THREE.BoxGeometry(0.14, 0.14, 0.8);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });

        this.items = [];
        for (let i = 0; i < size; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false;
            scene.add(mesh);
            this.items.push({ mesh, life: 0, dx: 0, dz: 0 });
        }
    }

    // Выстрел из позиции (x, z) в направлении (dx, dz), нормализованном
    spawn(x, z, dx, dz) {
        const b = this.items[this.idx++ % this.size];
        b.mesh.position.set(x + dx * 0.8, 1.0, z + dz * 0.8);
        b.mesh.rotation.y = Math.atan2(dx, dz);
        b.mesh.visible = true;
        b.life = BULLET_LIFE;
        b.dx = dx;
        b.dz = dz;
    }

    // Обновление: двигаем, гасим по времени или при попадании в препятствие
    update(dt, collision) {
        for (const b of this.items) {
            if (!b.mesh.visible) continue;

            b.life -= dt;
            const nx = b.mesh.position.x + b.dx * BULLET_SPEED * dt;
            const nz = b.mesh.position.z + b.dz * BULLET_SPEED * dt;

            if (b.life <= 0 || collision.isBlocked(nx, nz)) {
                b.mesh.visible = false;
                continue;
            }
            b.mesh.position.x = nx;
            b.mesh.position.z = nz;
        }
    }
}