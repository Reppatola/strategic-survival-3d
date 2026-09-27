// Камера: one-point perspective + загляд за прицелом.
// Не знает ни о герое, ни о игроке — получает их позиции как аргументы.
import * as THREE from 'three';
import { CAMERA } from '../config/camera.config.js';

export class CameraRig {
    constructor(camera) {
        this.camera = camera;
        this.camera.position.set(0, CAMERA.height, 0);
        this.camera.lookAt(0, 0, 0);
    }

    update(dt, playerPos, aimPoint) {
        // Вектор от игрока к прицелу (в плоскости XZ)
        const ax = aimPoint.x - playerPos.x;
        const az = aimPoint.z - playerPos.z;
        const aimLen = Math.hypot(ax, az);

        // Мёртвая зона: если мышь рядом с игроком — камера не двигается
        let dirX = 0, dirZ = 0;
        if (aimLen > CAMERA.deadZone) {
            dirX = ax / aimLen;
            dirZ = az / aimLen;
        }

        // Целевая позиция камеры: над игроком + загляд
        const look = Math.min(aimLen, CAMERA.maxLook) * CAMERA.lookK;
        const goalX = playerPos.x + dirX * look;
        const goalZ = playerPos.z + dirZ * look;

        // Разная скорость: к прицелу — резко, обратно — плавно
        const moving = Math.abs(goalX - this.camera.position.x) +
                       Math.abs(goalZ - this.camera.position.z) > 0.5;
        const k = moving ? CAMERA.lerpIn : CAMERA.lerpOut;

        this.camera.position.x += (goalX - this.camera.position.x) * Math.min(1, dt * k);
        this.camera.position.z += (goalZ - this.camera.position.z) * Math.min(1, dt * k);
        this.camera.position.y = CAMERA.height;

        // Камера строго вертикальна — смотрит в точку под собой.
        // Именно это даёт one-point perspective.
        this.camera.lookAt(this.camera.position.x, 0, this.camera.position.z);
    }
}