// Игрок: многочастная модель, движение, поворот, стрельба, HP, следы, анимация.
import * as THREE from 'three';
import { PLAYER } from '../config/player.config.js';
import { GAME } from '../config/game.config.js';

export class Player {
    constructor() {
        this.mesh = new THREE.Group();
        this.position = this.mesh.position;

        // Визуальный контейнер — качается при ходьбе, не двигает мир.
        // Важно: bob применяется сюда, а не к this.mesh, иначе игрок «улетит» вверх.
        this.bodyGroup = new THREE.Group();
        this.mesh.add(this.bodyGroup);

        this._walkPhase = 0;
        this._buildModel();

        this.state = 'IDLE';
        this.aimLen = 0;

        // Стрельба
        this._fireCooldown = 0;
        this.didShoot = false;
        this._shotDir = { dx: 0, dz: 1 };

        // Одноразовые действия
        this.didMelee = false;
        this.didGlass = false;
        this.didBoom  = false;

        // HP
        this.hp = 100;
        this.maxHp = 100;
        this.dead = false;
        this._invulnTimer = 0;

        // Следы
        this.didStep = false;
        this._stepTimer = 0;
    }

    _buildModel() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffcf5a, flatShading: true });
        const limbMat = new THREE.MeshStandardMaterial({ color: 0xd9a840, flatShading: true });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x222831 });
        const gunMat  = new THREE.MeshStandardMaterial({ color: 0x333333 });

        // --- Торс ---
        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.7, 0.4),
            bodyMat
        );
        torso.position.y = 1.0;
        torso.castShadow = true;

        // --- Голова ---
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 10, 8),
            bodyMat
        );
        head.position.y = 1.55;
        head.castShadow = true;

        // --- Визор (показывает направление взгляда) ---
        const visor = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 0.12, 0.15),
            darkMat
        );
        visor.position.set(0, 1.6, 0.22);

        // --- Левая рука (качается при ходьбе) ---
        // Пивот в плече, капсула смещена вниз — вращается вокруг плеча.
        this._leftArmPivot = new THREE.Group();
        this._leftArmPivot.position.set(-0.4, 1.15, 0);

        const leftArm = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.11, 0.5, 4, 8),
            limbMat
        );
        leftArm.position.y = -0.35;
        leftArm.castShadow = true;
        this._leftArmPivot.add(leftArm);

        // --- Правая рука (держит пистолет, статична) ---
        const rightArm = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.11, 0.5, 4, 8),
            limbMat
        );
        rightArm.position.set(0.4, 0.95, 0.1);
        rightArm.rotation.x = -Math.PI / 2.4;
        rightArm.castShadow = true;

        // --- Пистолет ---
        const gun = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.12, 0.5),
            gunMat
        );
        gun.position.set(0.32, 0.9, 0.4);
        gun.castShadow = true;

        // --- Ноги (качаются при ходьбе) ---
        this._leftLegPivot = new THREE.Group();
        this._leftLegPivot.position.set(-0.16, 0.65, 0);

        const leftLeg = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.13, 0.45, 4, 8),
            limbMat
        );
        leftLeg.position.y = -0.35;
        leftLeg.castShadow = true;
        this._leftLegPivot.add(leftLeg);

        this._rightLegPivot = new THREE.Group();
        this._rightLegPivot.position.set(0.16, 0.65, 0);

        const rightLeg = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.13, 0.45, 4, 8),
            limbMat
        );
        rightLeg.position.y = -0.35;
        rightLeg.castShadow = true;
        this._rightLegPivot.add(rightLeg);

        // Всё — в bodyGroup, чтобы bob не сдвигал world position
        this.bodyGroup.add(
            torso, head, visor,
            this._leftArmPivot, rightArm, gun,
            this._leftLegPivot, this._rightLegPivot
        );
    }

    takeDamage(amount) {
        if (this.dead || this._invulnTimer > 0) return;
        this.hp = Math.max(0, this.hp - amount);
        this._invulnTimer = 0.4;
        if (this.hp <= 0) this.dead = true;
    }

    update(dt, input, aimPoint, collision) {
        this._invulnTimer = Math.max(0, this._invulnTimer - dt);
        this._fireCooldown = Math.max(0, this._fireCooldown - dt);

        this.didMelee = false;
        this.didGlass = false;
        this.didBoom  = false;

        if (this.dead) {
            this.state = 'DEAD';
            this.didShoot = false;
            this.didStep  = false;
            this._animateIdle();
            return;
        }

        // --- Прицел ---
        const ax = aimPoint.x - this.position.x;
        const az = aimPoint.z - this.position.z;
        this.aimLen = Math.hypot(ax, az);

        // --- Поворот к прицелу ---
        if (this.aimLen > 0.5) {
            const target = Math.atan2(ax, az);
            this.mesh.rotation.y += this._shortestAngle(this.mesh.rotation.y, target) * Math.min(1, dt * 16);
        }

        // --- Движение (8 направлений) ---
        if (input.moving) {
            const len = Math.hypot(input.ix, input.iz);
            const dx = input.ix / len;
            const dz = input.iz / len;
            const speed = input.crouch ? PLAYER.speeds.crouch
                        : input.sprint ? PLAYER.speeds.sprint
                        : PLAYER.speeds.walk;

            const nx = THREE.MathUtils.clamp(this.position.x + dx * speed * dt, -GAME.worldHalf, GAME.worldHalf);
            const nz = THREE.MathUtils.clamp(this.position.z + dz * speed * dt, -GAME.worldHalf, GAME.worldHalf);

            collision.move(this.position, nx, nz);
            this.state = input.crouch ? 'CROUCH' : input.sprint ? 'SPRINT' : 'WALK';
        } else {
            this.state = 'IDLE';
        }

        // --- Анимация ---
        if (input.moving) this._animateWalk(dt);
        else this._animateIdle();

        // --- Следы ---
        this.didStep = false;
        if (input.moving) {
            this._stepTimer -= dt;
            const interval = input.crouch ? 0.55 : input.sprint ? 0.22 : 0.36;
            if (this._stepTimer <= 0) {
                this.didStep = true;
                this._stepTimer = interval;
            }
        } else {
            this._stepTimer = 0;
        }

        // --- Действия ---
        if (input.pressedQ) this.didMelee = true;
        if (input.pressedE) this.didGlass = true;
        if (input.pressedF) this.didBoom  = true;

        // --- Стрельба ---
        this.didShoot = false;
        if (input.fire && this._fireCooldown <= 0 && this.aimLen > 0.5) {
            this._shotDir.dx = ax / this.aimLen;
            this._shotDir.dz = az / this.aimLen;
            this.didShoot = true;
            this._fireCooldown = 0.16;
        }
    }

    // --- Ходьба: ноги машут, тело подпрыгивает, левая рука в противофазе ---
    _animateWalk(dt) {
        const speedScale = this.state === 'SPRINT' ? 14 : this.state === 'CROUCH' ? 6 : 9;
        const amplitude  = this.state === 'SPRINT' ? 0.65 : this.state === 'CROUCH' ? 0.22 : 0.45;

        this._walkPhase += dt * speedScale;
        const s = Math.sin(this._walkPhase);

        this.bodyGroup.position.y = Math.abs(s) * 0.06;

        this._leftLegPivot.rotation.x  =  s * amplitude;
        this._rightLegPivot.rotation.x = -s * amplitude;
        this._leftArmPivot.rotation.x  = -s * amplitude * 0.7;
    }

    // --- Покой: плавный возврат конечностей в ноль ---
    _animateIdle() {
        this.bodyGroup.position.y     *= 0.85;
        this._leftLegPivot.rotation.x *= 0.85;
        this._rightLegPivot.rotation.x *= 0.85;
        this._leftArmPivot.rotation.x *= 0.85;
    }

    _shortestAngle(from, to) {
        let d = (to - from) % (Math.PI * 2);
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        return d;
    }
}