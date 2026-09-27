import * as THREE from 'three';
import { Loop } from './Loop.js';
import { Renderer } from './Renderer.js';
import { GAME } from '../config/game.config.js';
import { CAMERA } from '../config/camera.config.js';
import { InputSystem } from '../systems/InputSystem.js';
import { AimSystem } from '../systems/AimSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { CameraRig } from '../systems/CameraRig.js';
import { NoiseSystem } from '../systems/NoiseSystem.js';
import { Player } from '../entities/Player.js';
import { BulletPool } from '../entities/BulletPool.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { World } from '../world/World.js';
import { HUD } from '../ui/HUD.js';

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
        this.noise = new NoiseSystem();

        // --- Мир ---
        // World наполняет сцену домами и деревьями и сам регистрирует коллизии
        this.world = new World(this.scene, this.collision);

        // --- Игрок ---
        this.player = new Player();
        this.bullets = new BulletPool(this.scene);
        this.spawner = new SpawnSystem(this.scene, this.collision);

        // Спавним 8 зомби вокруг игрока
        this.spawner.spawnRing(this.player.position, 8, 40, 80);
        this.scene.add(this.player.mesh);

        // --- UI ---
        this.hud = new HUD();

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

        _update(dt, elapsed) {
        // 1. Ввод
        const input = this.input.sample();

        // 2. Прицел
        const aimPoint = this.aim.update(input.mouseNDC);

        // 3. Игрок
        this.player.update(dt, input, aimPoint, this.collision);

        // 4. Стрельба игрока → спавним пулю + импульс шума
        if (this.player.didShoot) {
            this.bullets.spawn(
                this.player.position.x,
                this.player.position.z,
                this.player._shotDir.dx,
                this.player._shotDir.dz
            );
            this.noise.addImpulse();
        }

        // 5. Пули
        this.bullets.update(dt, this.collision);

        // 6. Зомби
        this.spawner.update(dt, this.player.position, this.collision, this.bullets);

        // 7. Шум
        this.noise.update(dt, this.player.state);

        // 8. Камера
        this.cameraRig.update(dt, this.player.position, aimPoint);

        // 9. Солнце следует за игроком
        this.sun.position.set(this.player.position.x + 35, 55, this.player.position.z + 20);
        this.sun.target.position.copy(this.player.position);
        this.sun.target.updateMatrixWorld();

        // 10. HUD
        this.hud.update(this.player, this.noise);

        // 11. Рендер
        this.renderer.render(this.scene, this.camera);
    }

    start() { this.loop.start(); }
    stop()  { this.loop.stop(); }
}