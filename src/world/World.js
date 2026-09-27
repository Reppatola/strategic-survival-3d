// Генерирует окружение: дома, деревья, коллизии.
// Работает через InstancedMesh — рисует сотни объектов за один вызов.
import * as THREE from 'three';
import { GAME } from '../config/game.config.js';

export class World {
    constructor(scene, collision) {
        this.scene = scene;
        this.collision = collision;

        this._generateLayout();
        this._buildBuildings();
        this._buildTrees();
    }

    _generateLayout() {
        this.buildings = [];
        this.trees = [];

        const SPACING = 26;
        const palette = [0xe8e4d8, 0xd9b48f, 0xb8c4cc, 0xc98d7a, 0xa8b89a, 0xd8cfc0, 0x9fb2c4];

        for (let gx = -7; gx <= 7; gx++) {
            for (let gz = -7; gz <= 7; gz++) {
                if (gx === 0 && gz === 0) continue;
                const x = gx * SPACING + (Math.random() - 0.5) * 6;
                const z = gz * SPACING + (Math.random() - 0.5) * 6;
                const r = Math.random();

                if (r < 0.55) {
                    const w = 7 + Math.random() * 8;
                    const d = 7 + Math.random() * 8;
                    const h = 5 + Math.random() * Math.random() * 20;
                    this.buildings.push({ x, z, w, d, h, c: palette[(Math.random() * palette.length) | 0] });

                    // Регистрируем коллизию дома
                    this.collision.registerBox(x, z, w, d);
                } else if (r < 0.75) {
                    const n = 2 + (Math.random() * 3 | 0);
                    for (let i = 0; i < n; i++) {
                        this.trees.push({
                            x: x + (Math.random() - 0.5) * 12,
                            z: z + (Math.random() - 0.5) * 12,
                            s: 0.8 + Math.random() * 0.8,
                        });
                    }
                }
            }
        }
    }

    _buildBuildings() {
        if (this.buildings.length === 0) return;

        const geo = new THREE.BoxGeometry(1, 1, 1);
        geo.translate(0, 0.5, 0); // привязка к нижней грани

        const mat = new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true });

        const mesh = new THREE.InstancedMesh(geo, mat, this.buildings.length);
        const M = new THREE.Matrix4();
        const Q = new THREE.Quaternion();
        const P = new THREE.Vector3();
        const S = new THREE.Vector3();

        this.buildings.forEach((b, i) => {
            P.set(b.x, 0, b.z);
            S.set(b.w, b.h, b.d);
            M.compose(P, Q, S);
            mesh.setMatrixAt(i, M);
            mesh.setColorAt(i, new THREE.Color(b.c));
        });

        mesh.castShadow = mesh.receiveShadow = true;
        this.scene.add(mesh);
    }

    _buildTrees() {
        if (this.trees.length === 0) return;

        const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 1, 6);
        trunkGeo.translate(0, 0.5, 0);

        const trunkMesh = new THREE.InstancedMesh(
            trunkGeo,
            new THREE.MeshStandardMaterial({ color: 0x7a5230, flatShading: true }),
            this.trees.length
        );

        const canopyMesh = new THREE.InstancedMesh(
            new THREE.IcosahedronGeometry(1.4, 0),
            new THREE.MeshStandardMaterial({ flatShading: true }),
            this.trees.length
        );

        const M = new THREE.Matrix4();
        const Q = new THREE.Quaternion();
        const P = new THREE.Vector3();
        const S = new THREE.Vector3();

        this.trees.forEach((t, i) => {
            const h = 2.2 * t.s;

            P.set(t.x, 0, t.z);
            S.set(t.s, h, t.s);
            M.compose(P, Q, S);
            trunkMesh.setMatrixAt(i, M);

            P.set(t.x, h + 1.0 * t.s, t.z);
            S.set(t.s, t.s * 1.15, t.s);
            M.compose(P, Q, S);
            canopyMesh.setMatrixAt(i, M);
            canopyMesh.setColorAt(i, new THREE.Color().setHSL(
                0.29 + Math.random() * 0.06, 0.45, 0.32 + Math.random() * 0.1
            ));
        });

        trunkMesh.castShadow = canopyMesh.castShadow = true;
        this.scene.add(trunkMesh, canopyMesh);
    }
}