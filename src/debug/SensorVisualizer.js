import * as THREE from 'three';
import { ZOMBIE } from '../config/zombie.config.js';

const COLOR_VISION_IDLE  = 0xffcc00;
const COLOR_VISION_ALERT = 0xffee44;
const COLOR_VISION_CHASE = 0xff4444;
const COLOR_SMELL        = 0xcc66ff;
const COLOR_HEARING      = 0xff8833;

const MAX_HEARING_RADIUS = 200;

export class SensorVisualizer {
    constructor(scene) {
        this.scene = scene;
        this.enabled = false;

        this.group = new THREE.Group();
        this.group.visible = false;
        scene.add(this.group);

        // Кольцо слуха игрока
        this.hearingRing = this._makeRing(1, COLOR_HEARING, 0.35, 0.5);
        this.group.add(this.hearingRing);

        this.byZombie = new Map();
        this._pulse = 0;
    }

    toggle() {
        this.enabled = !this.enabled;
        this.group.visible = this.enabled;
    }

    _makeVisionCone(angleDeg, range) {
        const vAngle = angleDeg * Math.PI / 180;
        const vHalf = vAngle / 2;
        const geo = new THREE.CircleGeometry(range, 32, -Math.PI / 2 - vHalf, vAngle);
        geo.rotateX(-Math.PI / 2);

        const mat = new THREE.MeshBasicMaterial({
            color: COLOR_VISION_IDLE,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.05;
        return mesh;
    }

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

    update(zombies, noiseSystem, playerPos, dt, smellTrail) {
        if (!this.enabled) return;
        this._pulse += (dt || 0.016) * 6;

        // --- Кольцо слуха игрока ---
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
            if (!entry) {
                entry = {
                    vision: this._makeVisionCone(z.type.vision.angle, z.type.vision.range),
                    smell: null,
                    hearing: this._makeRing(1, COLOR_HEARING, 0.2, 0.25),
                };
                this.group.add(entry.vision, entry.hearing);

                if (z.type.smell.range > 0) {
                    entry.smell = this._makeRing(z.type.smell.range, COLOR_SMELL, 0.25, 0.5);
                    this.group.add(entry.smell);
                }
                this.byZombie.set(z, entry);
            }

            const visible = z.alive;
            entry.vision.visible = visible;
            entry.hearing.visible = visible;
            if (entry.smell) entry.smell.visible = visible;
            if (!visible) continue;

            // Окраска конуса по состоянию
            let color = COLOR_VISION_IDLE;
            let opacity = 0.15;

            if (z.state === 'CHASE') {
                color = COLOR_VISION_CHASE;
                opacity = 0.28;
            } else if (z.state === 'ALERT') {
                color = COLOR_VISION_ALERT;
                opacity = 0.25 + Math.sin(this._pulse) * 0.15;
            } else if (z.state === 'SEARCH') {
                color = COLOR_VISION_IDLE;
                opacity = 0.18;
            }

            entry.vision.material.color.setHex(color);
            entry.vision.material.opacity = opacity;

            entry.vision.position.set(z.position.x, 0.05, z.position.z);
            entry.vision.rotation.y = z.mesh.rotation.y;

            // Радиус слуха зомби: где его порог слышимости достигается
            // Формула: d = 10^((level - threshold) / 20)
            const heard = z.lastHeardLevel;
            if (heard > ZOMBIE.hearingThreshold) {
                const r = Math.min(
                    Math.pow(10, (heard - ZOMBIE.hearingThreshold) / 20),
                    MAX_HEARING_RADIUS
                );
                entry.hearing.visible = true;
                entry.hearing.position.set(z.position.x, 0.04, z.position.z);
                entry.hearing.scale.setScalar(r);
            } else {
                entry.hearing.visible = false;
            }

            if (entry.smell) {
                entry.smell.position.set(z.position.x, 0.04, z.position.z);
            }
        }

        // --- Шлейф запаха ---
        smellTrail.setDebugVisible(true);
    }

    hideSmellTrail(smellTrail) {
        smellTrail.setDebugVisible(false);
    }
}