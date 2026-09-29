// Шлейф запаха. Точки на земле, оставляемые движущимися объектами.
// Затухают за 25 секунд. При V — визуализируются.
import * as THREE from 'three';

const LIFETIME = 25;
const EMIT_INTERVAL = 0.4;   // раз в 0.4 сек на объект
const COLOR_PLAYER = 0x4488ff;
const COLOR_ZOMBIE = 0x44ff88;

export class SmellTrail {
    constructor(scene) {
        this.scene = scene;
        this.points = [];       // { x, z, ownerId, kind, life, maxLife, mesh }
        this._timers = new Map(); // ownerId → секунд до следующей эмиссии

        this.group = new THREE.Group();
        this.group.visible = false;
        scene.add(this.group);

        this._geo = new THREE.CircleGeometry(0.5, 8);
    }

    // Вызывается каждый кадр для каждого активного объекта
    tickEmitter(ownerId, kind, x, z, moving, dt) {
        const last = this._timers.get(ownerId) || 0;
        const next = Math.max(0, last - dt);

        if (moving && next <= 0) {
            this._emit(x, z, ownerId, kind);
            this._timers.set(ownerId, EMIT_INTERVAL);
        } else {
            this._timers.set(ownerId, next);
        }
    }

    _emit(x, z, ownerId, kind) {
        const mat = new THREE.MeshBasicMaterial({
            color: kind === 'player' ? COLOR_PLAYER : COLOR_ZOMBIE,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(this._geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0.03, z);
        this.group.add(mesh);

        this.points.push({
            x, z,
            ownerId, kind,
            life: LIFETIME,
            maxLife: LIFETIME,
            mesh,
        });
    }

    update(dt) {
        for (let i = this.points.length - 1; i >= 0; i--) {
            const p = this.points[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.group.remove(p.mesh);
                p.mesh.material.dispose();
                this.points.splice(i, 1);
            } else {
                p.mesh.material.opacity = (p.life / p.maxLife) * 0.4;
            }
        }
    }

    // Ближайшая точка от указанного типа (или null)
    findNearest(x, z, kindFilter, maxDist) {
        let best = null;
        let bestDist = maxDist;
        for (const p of this.points) {
            if (kindFilter && p.kind !== kindFilter) continue;
            const d = Math.hypot(p.x - x, p.z - z);
            if (d < bestDist) {
                bestDist = d;
                best = p;
            }
        }
        return best ? { x: best.x, z: best.z, kind: best.kind, dist: bestDist } : null;
    }

    setDebugVisible(visible) {
        this.group.visible = visible;
    }

    clear() {
        for (const p of this.points) {
            this.group.remove(p.mesh);
            p.mesh.material.dispose();
        }
        this.points.length = 0;
        this._timers.clear();
    }
}