import * as THREE from 'three';
import { PLAYER } from '../config.js';

export default class Player {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;   // ← для проверки коллизий

    this.group = new THREE.Group();

    // Тело — капсула
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.45, 0.9, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0xffcf5a, flatShading: true })
    );
    body.position.y = 1.0;
    body.castShadow = true;
    this.group.add(body);
    this.body = body;

    // Визор
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.18, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x222831 })
    );
    visor.position.set(0, 1.45, 0.38);
    this.group.add(visor);

    // Пистолет
    const gun = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.16, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    gun.position.set(0.4, 1.0, 0.3);
    this.group.add(gun);

    // ← Уменьшаем всю модель
    this.group.scale.setScalar(PLAYER.modelScale);

    scene.add(this.group);

    this.walkTimer = 0;
  }

  update(dt, input) {
    const { x, z } = input.getMoveVector();
    const moving = x !== 0 || z !== 0;

    let speed = PLAYER.walkSpeed;
    if (input.isCrouching()) speed = PLAYER.crouchSpeed;
    else if (input.isSprinting()) speed = PLAYER.sprintSpeed;

    if (moving) {
      const len = Math.hypot(x, z);
      const dx = x / len;
      const dz = z / len;

      // Пробуем двигаться по X и Z отдельно — даёт «скольжение» вдоль стен
      const pos = this.group.position;
      const r = PLAYER.radius;

      const newX = pos.x + dx * speed * dt;
      if (!this.world.isBlocked(newX, pos.z, r)) {
        pos.x = newX;
      }

      const newZ = pos.z + dz * speed * dt;
      if (!this.world.isBlocked(pos.x, newZ, r)) {
        pos.z = newZ;
      }

      // Поворот
      const targetAngle = Math.atan2(dx, dz);
      this.group.rotation.y = this.smoothAngle(this.group.rotation.y, targetAngle, dt * 12);

      // Покачивание
      this.walkTimer += dt;
      this.body.position.y = 1.0 + Math.abs(Math.sin(this.walkTimer * 9)) * 0.12;

      return { moving: true, speed };
    } else {
      this.body.position.y = 1.0;
      this.walkTimer = 0;
      return { moving: false, speed: 0 };
    }
  }

  smoothAngle(current, target, factor) {
    let diff = (target - current) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return current + diff * Math.min(1, factor);
  }

  get position() {
    return this.group.position;
  }
}