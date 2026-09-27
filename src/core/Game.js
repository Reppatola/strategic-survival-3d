import * as THREE from 'three';
import { Loop } from './Loop.js';
import { Renderer } from './Renderer.js';
import { GAME } from '../config/game.config.js';
import { CAMERA } from '../config/camera.config.js';
import { InputSystem } from '../systems/InputSystem.js';
import { AimSystem } from '../systems/AimSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { CameraRig } from '../systems/CameraRig.js';
import { Player } from '../entities/Player.js';

export class Game {
    constructor(container) {
        // --- Рендер ---
        this.renderer = new Renderer(container);

        // --- Сцена ---
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(GAME.background);
        this.scene.fog = new THREE.Fog(GAME.background, GAME.fogNear, GAME.fogFar);

        // --- Камера ---
        this.camera = new THREE.PerspectiveCamera(
            CAMERA.fov,
            window.innerWidth / window.innerHeight,
            CAMERA.near,
            CAMERA.far
        );

        this.renderer.onResize((w, h) => {
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
        });

        // --- Наполнение сцены ---
        this._setupLights();
        this._setupGround();

        // --- Системы ---
        this.input = new InputSystem();
        this.aim = new AimSystem(this.camera);
        this.collision = new CollisionSystem();
        this.cameraRig = new CameraRig(this.camera);

        // --- Игрок ---
        this.player = new Player();
        this.scene.add(this.player.mesh);

        // Временные препятствия для проверки коллизии
        this._addTempObstacle(-20, 0, 8, 8);
        this._addTempObstacle(15, 15, 10, 6);

        // --- Цикл ---
        this.loop = new Loop((dt, elapsed) => this._update(dt, elapsed));
    }

    _setupLights() {
        const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x54452e, 0.85);
        this.scene.add(hemi);

        const sun = new THREE.DirectionalLight(0xfff2dd, 1.6);
        sun.position.set(35, 55, 20);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.camera.left = -70;
        sun.shadow.camera.right = 70;
        sun.shadow.camera.top = 70;
        sun.shadow.camera.bottom = -70;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 180;
        sun.shadow.bias = -0.0004;

        this.scene.add(sun);
        this.scene.add(sun.target);

        // ВАЖНО: сохраняем ссылку — она нужна в _update()
        this.sun = sun;
    }

    _setupGround() {
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(GAME.worldSize, GAME.worldSize),
            new THREE.MeshStandardMaterial({ color: 0x5d8a48, roughness: 1 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        const grid = new THREE.GridHelper(GAME.worldSize, GAME.worldHalf, 0x000000, 0x000000);
        grid.material.transparent = true;
        grid.material.opacity = GAME.gridOpacity;
        grid.position.y = 0.02;
        this.scene.add(grid);
    }

    _addTempObstacle(x, z, w, d) {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(w, 6, d),
            new THREE.MeshStandardMaterial({ color: 0xd9b48f, flatShading: true })
        );
        box.position.set(x, 3, z);
        box.castShadow = true;
        box.receiveShadow = true;
        this.scene.add(box);
        this.collision.registerBox(x, z, w, d);
    }

    _update(dt, elapsed) {
        // 1. Снять ввод
        const input = this.input.sample();

        // 2. Прицел: экран → точка на земле
        const aimPoint = this.aim.update(input.mouseNDC);

        // 3. Игрок
        this.player.update(dt, input, aimPoint, this.collision);

        // 4. Камера
        this.cameraRig.update(dt, this.player.position, aimPoint);

        // 5. Солнце следует за игроком
        this.sun.position.set(this.player.position.x + 35, 55, this.player.position.z + 20);
        this.sun.target.position.copy(this.player.position);
        this.sun.target.updateMatrixWorld();

        // 6. Рендер
        this.renderer.render(this.scene, this.camera);
    }

    start() { this.loop.start(); }
    stop()  { this.loop.stop(); }
}