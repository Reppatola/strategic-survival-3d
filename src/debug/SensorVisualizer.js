// Debug-визуализация сенсоров зомби: зрение, слух, нюх.
// Включается клавишей V. Не влияет на геймплей.
import * as THREE from 'three';
import { ZOMBIE } from '../config/zombie.config.js';

const COLOR_VISION  = 0xffcc00;   // жёлтый
const COLOR_SMELL   = 0xcc66ff;   // фиолетовый
const COLOR_HEARING = 0xff8833;   // оранжевый

const MAX_HEARING_RADIUS = 200;   // ограничение визуального радиуса слуха

export class SensorVisualizer {
    constructor(scene) {
        this.scene = scene;
        this.enabled = false;

        this.group = new THREE.Group();
        this.group.visible = false;
        scene.add(this.group);

        // Слух — кольцо вокруг игрока (обновляется каждый кадр)
        this.hearingRing = this._makeRing(1, COLOR_HEARING, 0.35, 0.5);
        this.group.add(this.hearingRing);

        // Кэш по зомби: { vision, smell }
        this.byZombie = new Map();
    }

    toggle() {
        this.enabled = !this.enabled;
        this.group.visible = this.enabled;
    }

    // --- Сектор зрения на земле ---
    _makeVisionCone(angleDeg, range) {
        const vAngle = angleDeg * Math.PI / 180;
        const vHalf = vAngle / 2;

        // Сектор лежит в XY. Направляем центр в -Y (после rotateX станет +Z).
        const geo = new THREE.CircleGeometry(
            range, 32,
            -Math.PI / 2 - vHalf,  // начало сектора
            vAngle                 // длина сектора
        );
        geo.rotateX(-Math.PI / 2);

        const mat = new THREE.MeshBasicMaterial({
            color: COLOR_VISION,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.05;
        return mesh;
    }

    // --- Тонкое кольцо (контур) ---
    _makeRing(radius, color, opacity = 0.25, thickness = 0.3) {
        const geo = new THREE.RingGeometry(
            Math.max(0, radius - thickness),
            radius, 64
        );
        geo.rotateX(-Math.PI / 2);

        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.04;
        return mesh;
    }

    // --- Обновление каждый кадр ---
    // zombies — массив из spawner.zombies
    // noiseSystem — текущая система шума
    // playerPos — позиция игрока
    update(zombies, noiseSystem, playerPos) {
        if (!this.enabled) return;

        // --- Круг слуха вокруг игрока ---
        // Радиус = где базовый walker (sensitivity 1.0) ещё слышит твой шум.
        // Формула: d = 10^((ownTotal − threshold) / 20)
        const own = noiseSystem.ownTotal;
        let hearingRadius = 0;
        if (own > ZOMBIE.hearingThreshold) {
            hearingRadius = Math.pow(10, (own - ZOMBIE.hearingThreshold) / 20);
            hearingRadius = Math.min(hearingRadius, MAX_HEARING_RADIUS);
        }

        if (hearingRadius > 0.5) {
            this.hearingRing.visible = true;
            this.hearingRing.position.set(playerPos.x, 0.04, playerPos.z);
            this.hearingRing.scale.setScalar(hearingRadius);
        } else {
            this.hearingRing.visible = false;
        }

        // --- По каждому зомби ---
        for (const z of zombies) {
            let entry = this.byZombie.get(z);

            // Создаём визуализации при первом появлении
            if (!entry) {
                entry = {
                    vision: this._makeVisionCone(
                        z.type.vision.angle,
                        z.type.vision.range
                    ),
                    smell: null,
                };
                this.group.add(entry.vision);

                if (z.type.smell.range > 0) {
                    entry.smell = this._makeRing(
                        z.type.smell.range,
                        COLOR_SMELL,
                        0.25,
                        0.5
                    );
                    this.group.add(entry.smell);
                }
                this.byZombie.set(z, entry);
            }

            // Мёртвых скрываем
            const visible = z.alive;
            entry.vision.visible = visible;
            if (entry.smell) entry.smell.visible = visible;
            if (!visible) continue;

            // Зрение: позиция + поворот по зомби
            entry.vision.position.set(z.position.x, 0.05, z.position.z);
            entry.vision.rotation.y = z.mesh.rotation.y;

            // Нюх: позиция
            if (entry.smell) {
                entry.smell.position.set(z.position.x, 0.04, z.position.z);
            }
        }

        // Чистим кэш от мёртвых, которых больше нет
        // (можно не делать — они просто невидимы, но память не течёт)
    }
}