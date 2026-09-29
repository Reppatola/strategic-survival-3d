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

        this.hearingRing = this._makeRing(1, COLOR_HEARING, 0.35, 0.5);
        this.group.add(this.hearingRing);

        this.byZombie = new Map();
        this._pulse = 0;
    }

    toggle() {
        this.enabled = !this.enabled;
        this.group.visible = this.enabled;
    }

    // Сектор: дуга от -angle/2 до +angle/2 от направления взгляда
    _makeArc(angleDeg, range, color, opacity = 0.12) {
        const vAngle = angleDeg * Math.PI / 180;
        const vHalf = vAngle / 2;
        const geo = new THREE.CircleGeometry(range, 32, -Math.PI / 2 - vHalf, vAngle);
        geo.rotateX(-Math.PI / 2);

        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.05;
        return mesh;
    }

    _makeRing(radius, color, opacity = 0.25, thickness = 0.3) {
        const geo = new THREE.RingGeometry(Math.max(0, radius - thickness), radius, 64);
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
        const playerThreshold = ZOMBIE.hearingThresholdFallback;
        let hearingRadius = 0;
        if (own > playerThreshold) {
            hearingRadius = Math.pow(10, (own - playerThreshold) / 20);
            hearingRadius = Math.min(hearingRadius, MAX_HEARING_RADIUS);
        }
        if (hearingRadius > 0.5) {
            this.hearingRing.visible = true;
            this.hearingRing.position.set(playerPos.x, 0.04, playerPos.z);
            this.hearingRing.scale.setScalar(hearingRadius);
        } else {
            this.hearingRing.visible = false;
        }

        // --- Каждый зомби ---
        for (const z of zombies) {
            let entry = this.byZombie.get(z);
            if (!entry) {
                entry = {
                    vision:   this._makeArc(z.type.vision.angle,  z.type.vision.range,  COLOR_VISION_IDLE),
                    hearing:  this._makeArc(z.type.hearing.angle, MAX_HEARING_RADIUS * 0.5, COLOR_HEARING, 0.08),
                    smell:    null,
                    smallSmell: null,
                };
                this.group.add(entry.vision, entry.hearing);

                if (z.type.smell.range > 15) {
                    entry.smell = this._makeArc(z.type.smell.angle, z.type.smell.range, COLOR_SMELL, 0.15);
                    this.group.add(entry.smell);
                } else if (z.type.smell.range > 0) {
                    entry.smallSmell = this._makeRing(z.type.smell.range, COLOR_SMELL, 0.35, 0.2);
                    this.group.add(entry.smallSmell);
                }

                this.byZombie.set(z, entry);
            }

            const visible = z.alive;
            entry.vision.visible = visible;
            entry.hearing.visible = visible;
            if (entry.smell) entry.smell.visible = visible;
            if (entry.smallSmell) entry.smallSmell.visible = visible;
            if (!visible) continue;

            // Цвет зрения по состоянию
            let visionColor = COLOR_VISION_IDLE;
            let visionOpacity = 0.15;
            if (z.state === 'CHASE') {
                visionColor = COLOR_VISION_CHASE;
                visionOpacity = 0.28;
            } else if (z.state === 'ALERT') {
                visionColor = COLOR_VISION_ALERT;
                visionOpacity = 0.25 + Math.sin(this._pulse) * 0.15;
            }
            entry.vision.material.color.setHex(visionColor);
            entry.vision.material.opacity = visionOpacity;

            entry.vision.position.set(z.position.x, 0.05, z.position.z);
            entry.vision.rotation.y = z.mesh.rotation.y;

            entry.hearing.position.set(z.position.x, 0.04, z.position.z);
            entry.hearing.rotation.y = z.mesh.rotation.y;

            if (entry.smell) {
                entry.smell.position.set(z.position.x, 0.04, z.position.z);
                entry.smell.rotation.y = z.mesh.rotation.y;
            }
            if (entry.smallSmell) {
                entry.smallSmell.position.set(z.position.x, 0.04, z.position.z);
            }
        }

        smellTrail.setDebugVisible(true);
    }

    hideSmellTrail(smellTrail) {
        smellTrail.setDebugVisible(false);
    }
}