import * as THREE from 'three';
import { ZOMBIE_TYPES, ZOMBIE } from '../config/zombie.config.js';
import { NOISE } from '../config/noise.config.js';

export class Zombie {
    constructor(x, z, typeKey = 'walker', id = null) {
        this.type = ZOMBIE_TYPES[typeKey] || ZOMBIE_TYPES.walker;
        this.typeKey = typeKey;
        this.id = id || ('z_' + Math.random().toString(36).slice(2, 8));

        this.mesh = new THREE.Group();
        this.position = this.mesh.position;
        this.position.set(x, 0, z);

        this._prevX = x;
        this._prevZ = z;

        this.alive = true;
        this.hp = this.type.hp;
        this.attackCooldown = 0;

        this.state = 'IDLE';
        this.lastKnownPos = new THREE.Vector3(x, 0, z);
        this.lastHeardPos = new THREE.Vector3(x, 0, z);
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
        this.noiseLevel = 0;

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

    _senseHearing(dt, noiseSystem) {
        const heard = noiseSystem.levelAtPoint(this.position.x, this.position.z);
        this.lastHeardLevel = heard;

        if (heard > ZOMBIE.hearingThreshold) {
            const rate = (heard - ZOMBIE.hearingThreshold) / 30
                       * this.type.hearing.sensitivity
                       * ZOMBIE.confidenceGain;
            this._hearingConfidence += rate * dt;

            const dom = noiseSystem.dominantSourceAt(this.position.x, this.position.z);
            if (dom) this.lastHeardPos.set(dom.x, 0, dom.z);
        } else {
            this._hearingConfidence -= ZOMBIE.confidenceDecay * dt;
        }
        this._hearingConfidence = THREE.MathUtils.clamp(this._hearingConfidence, 0, 1);
        return this._hearingConfidence >= ZOMBIE.confidenceTrigger;
    }

    // Зрение: видит игрока или агрессивного зомби
    _senseVision(playerPos, collision, aggressiveZombies) {
        // 1. Игрок
        if (this._canSee(playerPos.x, playerPos.z, collision, this.type.vision.range)) {
            return { kind: 'player', x: playerPos.x, z: playerPos.z };
        }

        // 2. Агрессивный зомби
        if (aggressiveZombies) {
            for (const az of aggressiveZombies) {
                if (az === this) continue;
                if (!az.alive) continue;
                if (this._canSee(az.position.x, az.position.z, collision, this.type.vision.range)) {
                    return { kind: 'zombie', x: az.position.x, z: az.position.z };
                }
            }
        }

        return null;
    }

    _canSee(tx, tz, collision, range) {
        const dx = tx - this.position.x;
        const dz = tz - this.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > range || dist < 0.01) return false;

        const lookX = Math.sin(this.mesh.rotation.y);
        const lookZ = Math.cos(this.mesh.rotation.y);
        const dot = (lookX * dx + lookZ * dz) / dist;
        const angle = Math.acos(THREE.MathUtils.clamp(dot, -1, 1)) * 180 / Math.PI;
        if (angle > this.type.vision.angle / 2) return false;

        if (collision.lineBlocked(this.position.x, this.position.z, tx, tz)) return false;
        return true;
    }

    // Запах: идёт по шлейфу игрока
    _senseSmell(smellTrail) {
        const s = this.type.smell;
        if (s.range <= 0) return null;

        const point = smellTrail.findNearest(this.position.x, this.position.z, 'player', s.range);
        if (!point) return null;

        // Направленный нюх (у sniffer угол 90°)
        if (s.angle < 180) {
            const dx = point.x - this.position.x;
            const dz = point.z - this.position.z;
            const dist = Math.hypot(dx, dz);
            if (dist > 0.01) {
                const lookX = Math.sin(this.mesh.rotation.y);
                const lookZ = Math.cos(this.mesh.rotation.y);
                const dot = (lookX * dx + lookZ * dz) / dist;
                const angle = Math.acos(THREE.MathUtils.clamp(dot, -1, 1)) * 180 / Math.PI;
                if (angle > s.angle / 2) return null;
            }
        }

        return point;
    }

    _tryScream(noiseSystem) {
        if (!this.type.scream) return;
        if (this._screamCooldown > 0) return;

        this._screamCooldown = this.type.scream.cooldown;
        this.didScream = true;
        noiseSystem.addImpulse('scream', this.position.x, this.position.z, 'world');
    }

    _enterAlert(targetX, targetZ, noiseSystem) {
        const confidence = Math.max(this._hearingConfidence, this._visionConfidence);
        const bonus = ZOMBIE.confidenceAlertBonus * confidence;
        const penalty = this.type.alert.silencePenalty;

        this.alertTimer = this.type.alert.base * (1 - bonus) * penalty;
        this.alertSignal.set(targetX, 0, targetZ);
        this.state = 'ALERT';
        this._alertPulse = 0;

        this._tryScream(noiseSystem);
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

    update(dt, playerPos, noiseSystem, playerDead, collision, aggressiveZombies, smellTrail) {
        if (!this.alive) return 0;

        this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        this._screamCooldown = Math.max(0, this._screamCooldown - dt);
        this.didScream = false;

        if (playerDead) {
            this.state = 'IDLE';
            this.alertRing.material.opacity = 0;
            this.noiseLevel = 0;
            return 0;
        }

        const distToPlayer = Math.hypot(
            playerPos.x - this.position.x,
            playerPos.z - this.position.z
        );
        const nearPlayer = distToPlayer < ZOMBIE.attackRange * 1.5;

        // --- Сенсоры ---
        const vision = this._senseVision(playerPos, collision, aggressiveZombies);
        const seesPlayer = vision && vision.kind === 'player';
        const seesAggressiveZombie = vision && vision.kind === 'zombie';

        this._visionConfidence = THREE.MathUtils.clamp(
            this._visionConfidence + (seesPlayer ? dt * 1.5 : -ZOMBIE.confidenceDecay * dt),
            0, 1
        );

        const hears = this._senseHearing(dt, noiseSystem);
        const smell = this._senseSmell(smellTrail);

        // --- State machine ---
        switch (this.state) {
            case 'IDLE': {
                if (seesPlayer) {
                    this._enterAlert(playerPos.x, playerPos.z, noiseSystem);
                } else if (seesAggressiveZombie) {
                    this._enterAlert(vision.x, vision.z, noiseSystem);
                } else if (hears) {
                    this._enterAlert(this.lastHeardPos.x, this.lastHeardPos.z, noiseSystem);
                } else if (smell) {
                    this._enterAlert(smell.x, smell.z, noiseSystem);
                }
                break;
            }

            case 'ALERT': {
                this.alertTimer -= dt;
                this._alertPulse += dt * 6;
                this.alertRing.material.opacity = 0.4 + Math.sin(this._alertPulse) * 0.3;

                if (seesPlayer) this.alertSignal.set(playerPos.x, 0, playerPos.z);
                else if (seesAggressiveZombie) this.alertSignal.set(vision.x, 0, vision.z);
                else if (hears) this.alertSignal.set(this.lastHeardPos.x, 0, this.lastHeardPos.z);

                this._facePoint(this.alertSignal.x, this.alertSignal.z, dt);

                if (this.alertTimer <= 0) {
                    this.alertRing.material.opacity = 0;
                    if (seesPlayer) {
                        this.state = 'CHASE';
                        this.lastKnownPos.set(playerPos.x, 0, playerPos.z);
                    } else if (seesAggressiveZombie) {
                        this._enterSearch(vision.x, vision.z);
                    } else if (hears) {
                        this._enterSearch(this.lastHeardPos.x, this.lastHeardPos.z);
                    } else if (smell) {
                        this._enterSearch(smell.x, smell.z);
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

                if (seesPlayer || nearPlayer) {
                    this._enterAlert(playerPos.x, playerPos.z, noiseSystem);
                } else if (hears && this._hearingConfidence > ZOMBIE.chaseJumpConfidence) {
                    this.state = 'CHASE';
                    this.lastKnownPos.set(this.lastHeardPos.x, 0, this.lastHeardPos.z);
                    this._timeSinceSignal = 0;
                } else if (hears) {
                    this.lastKnownPos.set(this.lastHeardPos.x, 0, this.lastHeardPos.z);
                    this.searchTimer = Math.max(this.searchTimer, 2);
                } else if (smell) {
                    this.lastKnownPos.set(smell.x, 0, smell.z);
                    this.searchTimer = Math.max(this.searchTimer, 2);
                }

                if (dToSearch < ZOMBIE.arrivalDist || this.searchTimer <= 0) {
                    this.state = 'IDLE';
                }
                break;
            }

            case 'CHASE': {
                const seesOrNear = seesPlayer || nearPlayer;

                if (seesOrNear) {
                    this.lastKnownPos.set(playerPos.x, 0, playerPos.z);
                    this._timeSinceSignal = 0;
                    if (nearPlayer && !seesPlayer) {
                        this._facePoint(playerPos.x, playerPos.z, dt, 10);
                    }
                } else {
                    this._timeSinceSignal += dt;
                    if (this._timeSinceSignal > ZOMBIE.chaseLossTimeout) {
                        this._enterSearch(playerPos.x, playerPos.z);
                        break;
                    }
                }

                if (seesPlayer || hears) this._tryScream(noiseSystem);

                this._moveTowards(this.lastKnownPos.x, this.lastKnownPos.z, dt, collision);

                if (distToPlayer < ZOMBIE.attackRange && this.attackCooldown <= 0) {
                    this.attackCooldown = ZOMBIE.attackCooldown;
                    return ZOMBIE.attackDamage;
                }
                break;
            }
        }

        // --- Шум: только если реально сдвинулся в этом кадре ---
        const moved = Math.hypot(
            this.position.x - this._prevX,
            this.position.z - this._prevZ
        );
        this._prevX = this.position.x;
        this._prevZ = this.position.z;

        if (moved < 0.001) {
            this.noiseLevel = 0;
        } else if (this.state === 'CHASE') {
            this.noiseLevel = 70;
        } else if (this.state === 'SEARCH') {
            this.noiseLevel = 30;
        } else {
            this.noiseLevel = 0;
        }

        // --- Запах: эмитим в шлейф, если двигаемся ---
        smellTrail.tickEmitter(this.id, 'zombie', this.position.x, this.position.z, moved > 0.001, dt);

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
        this.noiseLevel = 0;
    }
}