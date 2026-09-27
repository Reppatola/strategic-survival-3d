// Зомби с системой восприятия: слух + зрение + нюх.
// Поведение — простой state machine: IDLE, SEARCH, CHASE, ATTACK.
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

        // --- Состояние AI ---
        this.state = 'IDLE';                       // IDLE | SEARCH | CHASE | ATTACK
        this.lastKnownPos = new THREE.Vector3(x, 0, z);
        this._hearingConfidence = 0;
        this._timeSinceSignal = 999;
        this._screamCooldown = 0;
        this.didScream = false;

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

        this.mesh.add(body, head);
    }

    // ---------- СЕНСОРЫ ----------

    // Слух: накапливает уверенность, пока слышно.
    // Возвращает true, если уверенность превысила порог.
    _senseHearing(dt, playerPos, noiseSystem) {
        const d = Math.hypot(playerPos.x - this.position.x, playerPos.z - this.position.z);
        const heard = noiseSystem.levelAt(d);

        if (heard > ZOMBIE.hearingThreshold) {
            const rate = (heard - ZOMBIE.hearingThreshold) / 30 * this.type.hearing.sensitivity;
            this._hearingConfidence += rate * dt;
        } else {
            this._hearingConfidence -= ZOMBIE.confidenceDecay * dt;
        }
        this._hearingConfidence = THREE.MathUtils.clamp(this._hearingConfidence, 0, 1);

        return this._hearingConfidence >= ZOMBIE.confidenceTrigger;
    }

    // Зрение: конус + проверка перекрытия стен.
    _senseVision(playerPos, collision) {
        const v = this.type.vision;
        const dx = playerPos.x - this.position.x;
        const dz = playerPos.z - this.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist > v.range) return false;

        // Направление взгляда — куда смотрит меш (rotation.y)
        const lookX = Math.sin(this.mesh.rotation.y);
        const lookZ = Math.cos(this.mesh.rotation.y);

        // Косинус угла между взглядом и направлением на игрока
        const dot = (lookX * dx + lookZ * dz) / (dist || 1);
        const angle = Math.acos(THREE.MathUtils.clamp(dot, -1, 1)) * 180 / Math.PI;

        if (angle > v.angle / 2) return false;

        // Проверка перекрытия зданием
        if (collision.lineBlocked(this.position.x, this.position.z, playerPos.x, playerPos.z)) {
            return false;
        }

        return true;
    }

    // Нюх: направленный, постоянный. Не требует накопления.
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

    // ---------- ОБНОВЛЕНИЕ ----------

    update(dt, playerPos, noiseSystem, playerDead, collision) {
        if (!this.alive) return 0;

        this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        this._screamCooldown = Math.max(0, this._screamCooldown - dt);
        this.didScream = false;

        if (playerDead) {
            this.state = 'IDLE';
            return 0;
        }

        const distToPlayer = Math.hypot(
            playerPos.x - this.position.x,
            playerPos.z - this.position.z
        );

        // --- Собираем сигналы ---
        const seesPlayer = this._senseVision(playerPos, collision);
        const hearsPlayer = this._senseHearing(dt, playerPos, noiseSystem);
        const smellsPlayer = this._senseSmell(playerPos);

        // --- Логика переходов ---
        if (seesPlayer) {
            this.state = 'CHASE';
            this.lastKnownPos.set(playerPos.x, 0, playerPos.z);
            this._timeSinceSignal = 0;

            // Крикун кричит при виде игрока
            if (this.type.scream && this._screamCooldown <= 0) {
                this._screamCooldown = this.type.scream.cooldown;
                this.didScream = true;
            }
        } else if (hearsPlayer) {
            if (this.state !== 'CHASE') this.state = 'SEARCH';
            this.lastKnownPos.set(playerPos.x, 0, playerPos.z);
            this._timeSinceSignal = 0;
        } else if (smellsPlayer) {
            if (this.state === 'IDLE') this.state = 'SEARCH';
            // Нюх — менее точный, поэтому с разбросом
            this.lastKnownPos.set(
                playerPos.x + (Math.random() - 0.5) * 8,
                0,
                playerPos.z + (Math.random() - 0.5) * 8
            );
            this._timeSinceSignal = 0;
        } else {
            this._timeSinceSignal += dt;
        }

        // Если долго нет сигналов — успокаиваемся
        if (this.state === 'SEARCH' && this._timeSinceSignal > ZOMBIE.searchTimeout) {
            this.state = 'IDLE';
        }

        // --- Поведение ---
        if (this.state === 'CHASE') {
            this._moveTowards(playerPos.x, playerPos.z, dt, collision);

            // Если совсем близко — атакуем
            if (distToPlayer < ZOMBIE.attackRange && this.attackCooldown <= 0) {
                this.attackCooldown = ZOMBIE.attackCooldown;
                return ZOMBIE.attackDamage;
            }
        } else if (this.state === 'SEARCH') {
            this._moveTowards(this.lastKnownPos.x, this.lastKnownPos.z, dt, collision);
            const d = Math.hypot(
                this.lastKnownPos.x - this.position.x,
                this.lastKnownPos.z - this.position.z
            );
            if (d < ZOMBIE.arrivalDist) {
                this.state = 'IDLE';
            }
        }

        return 0;
    }

    _moveTowards(tx, tz, dt, collision) {
        const dx = tx - this.position.x;
        const dz = tz - this.position.z;
        const len = Math.hypot(dx, dz);
        if (len < 0.01) return;

        const nx = this.position.x + (dx / len) * this.type.speed * dt;
        const nz = this.position.z + (dz / len) * this.type.speed * dt;
        collision.move(this.position, nx, nz);
        this.mesh.rotation.y = Math.atan2(dx, dz);
    }

    die() {
        this.alive = false;
        this.mesh.visible = false;
    }
}