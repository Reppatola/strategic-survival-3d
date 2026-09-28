// Зомби с системой восприятия: слух + зрение + нюх.
// Состояния: IDLE → ALERT → CHASE → SEARCH → IDLE.
//
// ALERT — «замер и поворот к сигналу». Даёт игроку окно среагировать.
// Длительность = base × (1 − confidence_bonus) × silence_penalty.
import * as THREE from 'three';
import { ZOMBIE_TYPES, ZOMBIE } from '../config/zombie.config.js';

export class Zombie {
    constructor(x, z, typeKey = 'walker') {
        this.type = ZOMBIE_TYPES[typeKey] || ZOMBIE_TYPES.walker;
        this.typeKey = typeKey;

        this.mesh = new THREE.Group();
        this.position = this.mesh.position;
        this.position.set(x, 0, z);

        this.alive = true;
        this.hp = this.type.hp;
        this.attackCooldown = 0;

        // AI
        this.state = 'IDLE';
        this.lastKnownPos = new THREE.Vector3(x, 0, z);
        this.alertSignal = new THREE.Vector3(x, 0, z);

        this.alertTimer = 0;
        this.searchTimer = 0;

        this._hearingConfidence = 0;
        this._visionConfidence = 0;
        this._timeSinceSignal = 999;
        this._screamCooldown = 0;
        this._alertPulse = 0;

        this.didScream = false;
        this.lastHeardLevel = 0;

        this._buildModel();
    }

    _buildModel() {
        const body = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.4, 0.8, 6, 12),
            new THREE.MeshStandardMaterial({ color: this.type.color, flatShading: true })
        );
        body.position.y = 0.9;
        body.castShadow = true;

        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshStandardMaterial({ color: this.type.colorHead, flatShading: true })
        );
        head.position.y = 1.65;
        head.castShadow = true;

        const ringGeo = new THREE.RingGeometry(0.65, 0.8, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        this.alertRing = new THREE.Mesh(ringGeo, ringMat);
        this.alertRing.rotation.x = -Math.PI / 2;
        this.alertRing.position.y = 0.07;

        this.mesh.add(body, head, this.alertRing);
    }

    // ---------- СЕНСОРЫ ----------

    _senseHearing(dt, noiseSystem) {
        const heard = noiseSystem.levelAtPoint(this.position.x, this.position.z);
        this.lastHeardLevel = heard;

        if (heard > ZOMBIE.hearingThreshold) {
            const rate = (heard - ZOMBIE.hearingThreshold) / 30
                       * this.type.hearing.sensitivity
                       * ZOMBIE.confidenceGain;
            this._hearingConfidence += rate * dt;
        } else {
            this._hearingConfidence -= ZOMBIE.confidenceDecay * dt;
        }
        this._hearingConfidence = THREE.MathUtils.clamp(this._hearingConfidence, 0, 1);
        return this._hearingConfidence >= ZOMBIE.confidenceTrigger;
    }

    _senseVision(playerPos, collision) {
        const v = this.type.vision;
        const dx = playerPos.x - this.position.x;
        const dz = playerPos.z - this.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > v.range) return false;

        const lookX = Math.sin(this.mesh.rotation.y);
        const lookZ = Math.cos(this.mesh.rotation.y);
        const dot = (lookX * dx + lookZ * dz) / (dist || 1);
        const angle = Math.acos(THREE.MathUtils.clamp(dot, -1, 1)) * 180 / Math.PI;
        if (angle > v.angle / 2) return false;

        if (collision.lineBlocked(this.position.x, this.position.z, playerPos.x, playerPos.z)) {
            return false;
        }
        return true;
    }

    _senseSmell(playerPos) {
        const s = this.type.smell;
        if (s.range <= 0) return false;

        const dx = playerPos.x - this.position.x;
        const dz = playerPos.z - this.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > s.range) return false;

        const lookX = Math.sin(this.mesh.rotation.y);
        const lookZ = Math.cos(this.mesh.rotation.y);
        const dot = (lookX * dx + lookZ * dz) / (dist || 1);
        const angle = Math.acos(THREE.MathUtils.clamp(dot, -1, 1)) * 180 / Math.PI;
        return angle <= s.angle / 2;
    }

    // ---------- ПЕРЕХОДЫ ----------

    _enterAlert(targetX, targetZ) {
        const confidence = Math.max(this._hearingConfidence, this._visionConfidence);
        const bonus = ZOMBIE.confidenceAlertBonus * confidence;
        const penalty = this.type.alert.silencePenalty;

        this.alertTimer = this.type.alert.base * (1 - bonus) * penalty;
        this.alertSignal.set(targetX, 0, targetZ);
        this.state = 'ALERT';
        this._alertPulse = 0;

        if (this.type.scream && this._screamCooldown <= 0) {
            this._screamCooldown = this.type.scream.cooldown;
            this.didScream = true;
        }
    }

    _enterSearch(targetX, targetZ) {
        const r = this.type.search.radius;
        const a = Math.random() * Math.PI * 2;
        this.lastKnownPos.set(
            targetX + Math.cos(a) * r * Math.random(),
            0,
            targetZ + Math.sin(a) * r * Math.random()
        );
        this.searchTimer = this.type.search.base * this.type.search.persistence;
        this.state = 'SEARCH';
    }

    _facePoint(x, z, dt, rate = 8) {
        const dx = x - this.position.x;
        const dz = z - this.position.z;
        if (Math.hypot(dx, dz) < 0.01) return;
        const target = Math.atan2(dx, dz);
        let d = (target - this.mesh.rotation.y) % (Math.PI * 2);
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        this.mesh.rotation.y += d * Math.min(1, dt * rate);
    }

    // ---------- ОБНОВЛЕНИЕ ----------

    update(dt, playerPos, noiseSystem, playerDead, collision) {
        if (!this.alive) return 0;

        this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        this._screamCooldown = Math.max(0, this._screamCooldown - dt);
        this.didScream = false;

        if (playerDead) {
            this.state = 'IDLE';
            this.alertRing.material.opacity = 0;
            return 0;
        }

        const distToPlayer = Math.hypot(
            playerPos.x - this.position.x,
            playerPos.z - this.position.z
        );

        // Игрок вплотную: зомби не может его «потерять».
        // attackRange * 1.5 ≈ 2.1 м — буфер вокруг реальной дистанции удара.
        const nearPlayer = distToPlayer < ZOMBIE.attackRange * 1.5;

        // --- Сенсоры ---
        const sees = this._senseVision(playerPos, collision);
        this._visionConfidence = THREE.MathUtils.clamp(
            this._visionConfidence + (sees ? dt * 1.5 : -ZOMBIE.confidenceDecay * dt),
            0, 1
        );
        const hears = this._senseHearing(dt, noiseSystem);
        const smells = this._senseSmell(playerPos);

        // --- State machine ---
        switch (this.state) {
            case 'IDLE': {
                if (sees || hears || smells) this._enterAlert(playerPos.x, playerPos.z);
                break;
            }

            case 'ALERT': {
                this.alertTimer -= dt;
                this._alertPulse += dt * 6;
                this.alertRing.material.opacity = 0.4 + Math.sin(this._alertPulse) * 0.3;

                if (sees || hears) {
                    this.alertSignal.set(playerPos.x, 0, playerPos.z);
                }
                this._facePoint(this.alertSignal.x, this.alertSignal.z, dt);

                if (this.alertTimer <= 0) {
                    this.alertRing.material.opacity = 0;
                    if (sees) {
                        this.state = 'CHASE';
                        this.lastKnownPos.set(playerPos.x, 0, playerPos.z);
                    } else if (hears || smells) {
                        this._enterSearch(playerPos.x, playerPos.z);
                    } else {
                        this.state = 'IDLE';
                    }
                }
                break;
            }

            case 'SEARCH': {
                this.searchTimer -= dt;
                this._moveTowards(this.lastKnownPos.x, this.lastKnownPos.z, dt, collision);

                const dToSearch = Math.hypot(
                    this.lastKnownPos.x - this.position.x,
                    this.lastKnownPos.z - this.position.z
                );

                if (sees || nearPlayer) {
                    this._enterAlert(playerPos.x, playerPos.z);
                } else if (hears && this._hearingConfidence > ZOMBIE.chaseJumpConfidence) {
                    this.state = 'CHASE';
                    this.lastKnownPos.set(playerPos.x, 0, playerPos.z);
                    this._timeSinceSignal = 0;
                } else if (hears || smells) {
                    this.lastKnownPos.set(playerPos.x, 0, playerPos.z);
                    this.searchTimer = Math.max(this.searchTimer, 2);
                }

                if (dToSearch < ZOMBIE.arrivalDist || this.searchTimer <= 0) {
                    this.state = 'IDLE';
                }
                break;
            }

            case 'CHASE': {
                // Игрок вплотную — не теряем его, даже если отвернулись.
                const seesOrNear = sees || nearPlayer;

                if (seesOrNear) {
                    this.lastKnownPos.set(playerPos.x, 0, playerPos.z);
                    this._timeSinceSignal = 0;

                    // Вплотную, но не видим — принудительно поворачиваемся к игроку.
                    // (иначе зомби стоит спиной и «слепнет» по конусу)
                    if (nearPlayer && !sees) {
                        this._facePoint(playerPos.x, playerPos.z, dt, 10);
                    }
                } else {
                    this._timeSinceSignal += dt;
                    if (this._timeSinceSignal > ZOMBIE.chaseLossTimeout) {
                        this._enterSearch(playerPos.x, playerPos.z);
                        break;
                    }
                }

                this._moveTowards(this.lastKnownPos.x, this.lastKnownPos.z, dt, collision);

                if (distToPlayer < ZOMBIE.attackRange && this.attackCooldown <= 0) {
                    this.attackCooldown = ZOMBIE.attackCooldown;
                    return ZOMBIE.attackDamage;
                }
                break;
            }
        }

        return 0;
    }

    _moveTowards(tx, tz, dt, collision) {
        const dx = tx - this.position.x;
        const dz = tz - this.position.z;
        const len = Math.hypot(dx, dz);
        if (len < 0.01) return;

        const ux = dx / len, uz = dz / len;

        if (this._tryStep(ux, uz, dt, collision)) return;

        for (const a of [1.05, -1.05, 2.09, -2.09]) {
            const c = Math.cos(a), s = Math.sin(a);
            const rx = ux * c - uz * s;
            const rz = ux * s + uz * c;
            if (this._tryStep(rx, rz, dt, collision)) return;
        }
    }

    _tryStep(ux, uz, dt, collision) {
        const nx = this.position.x + ux * this.type.speed * dt;
        const nz = this.position.z + uz * this.type.speed * dt;
        const moved = collision.move(this.position, nx, nz);
        if (moved) this.mesh.rotation.y = Math.atan2(ux, uz);
        return moved;
    }

    die() {
        this.alive = false;
        this.mesh.visible = false;
    }
}