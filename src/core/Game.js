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
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { Player } from '../entities/Player.js';
import { BulletPool } from '../entities/BulletPool.js';
import { FootprintPool } from '../entities/FootprintPool.js';
import { NoiseRing } from '../entities/NoiseRing.js';
import { MuzzleFlash } from '../entities/MuzzleFlash.js';
import { SmellTrail } from '../entities/SmellTrail.js';
import { World } from '../world/World.js';
import { HUD } from '../ui/HUD.js';
import { Crosshair } from '../ui/Crosshair.js';
import { DamageIndicator } from '../ui/DamageIndicator.js';
import { SensorVisualizer } from '../debug/SensorVisualizer.js';

export class Game {
    constructor(container, { onPlayerDeath, onVictory } = {}) {
        this.container = container;
        this.onPlayerDeath = onPlayerDeath || null;
        this.onVictory = onVictory || null;
        this._deathFired = false;
        this._victoryFired = false;

        this.renderer = new Renderer(container);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(GAME.background);
        this.scene.fog = new THREE.Fog(GAME.background, GAME.fogNear, GAME.fogFar);

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

        this._setupLights();
        this._setupGround();

        // --- Системы ---
        this.input = new InputSystem();
        this.aim = new AimSystem(this.camera);
        this.collision = new CollisionSystem();
        this.cameraRig = new CameraRig(this.camera);
        this.noise = new NoiseSystem();
        this.audio = new AudioSystem();

        const unlockAudio = () => this.audio.unlock();
        window.addEventListener('pointerdown', unlockAudio, { once: true });
        window.addEventListener('keydown', unlockAudio, { once: true });

        // --- Мир ---
        this.world = new World(this.scene, this.collision);

        // --- Игрок ---
        this.player = new Player();
        this.scene.add(this.player.mesh);

        // --- Визуал ---
        this.bullets = new BulletPool(this.scene);
        this.footprints = new FootprintPool(this.scene);
        this.noiseRing = new NoiseRing(this.scene);
        this.muzzleFlash = new MuzzleFlash(this.scene);
        this.smellTrail = new SmellTrail(this.scene);

        // --- Враги ---
        this.spawner = new SpawnSystem(this.scene, this.collision);
        this.spawner.spawnMixed(this.player.position);

        // --- UI ---
        this.hud = new HUD();
        this.crosshair = new Crosshair(this.scene);
        this.damageIndicator = new DamageIndicator();

        // --- Debug ---
        this.sensorVisualizer = new SensorVisualizer(this.scene);

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
        // --- Проверка смерти игрока ---
        if (this.player.dead && !this._deathFired) {
            this._deathFired = true;
            if (this.onPlayerDeath) this.onPlayerDeath();
        }

        // --- Проверка победы: игрок жив, зомби не осталось ---
        if (!this._victoryFired && !this.player.dead && this.spawner.countAlive() === 0) {
            this._victoryFired = true;
            if (this.onVictory) this.onVictory();
        }

        const input = this.input.sample();
        const aimPoint = this.aim.update(input.mouseNDC);

        const px = this.player.position.x;
        const pz = this.player.position.z;

        // --- Debug: V ---
        if (input.pressedV) {
            this.sensorVisualizer.toggle();
            if (!this.sensorVisualizer.enabled) {
                this.sensorVisualizer.hideSmellTrail(this.smellTrail);
            }
        }

        // --- Игрок ---
        this.player.update(dt, input, aimPoint, this.collision, this.smellTrail);

        // --- Следы + звук шага ---
        if (this.player.didStep) {
            this.footprints.spawn(px, pz);
            const stepType = this.player.state === 'CROUCH' ? 'crouch'
                           : this.player.state === 'SPRINT' ? 'sprint'
                           : 'walk';
            this.audio.playAt(`step_${stepType}`, px, pz, px, pz);
        }

        // --- Стрельба ---
        if (this.player.didShoot) {
            this.bullets.spawn(px, pz, this.player._shotDir.dx, this.player._shotDir.dz);
            this.noise.addImpulse('shot', px, pz, 'player');
            this.muzzleFlash.trigger(this.player.position, this.player._shotDir);
            this.audio.playAt('shot', px, pz, px, pz);
        }

        // --- Одноразовые действия ---
        if (this.player.didMelee) this.noise.addImpulse('melee', px, pz, 'player');
        if (this.player.didGlass) this.noise.addImpulse('glass', px, pz, 'player');
        if (this.player.didBoom)  this.noise.addImpulse('boom',  px, pz, 'player');

        this.bullets.update(dt, this.collision);
        this.footprints.update(dt);
        this.muzzleFlash.update(dt);

        // --- Шум ---
        this.noise.update(dt, this.player.state, this.player.position);

        // --- Зомби ---
        const damageToPlayer = this.spawner.update(
            dt,
            this.player.position,
            this.noise,
            this.player.dead,
            this.collision,
            this.bullets,
            this.smellTrail
        );
        if (damageToPlayer > 0) {
            this.player.takeDamage(damageToPlayer);
            this.damageIndicator.flash();
        }

        // --- Озвучка криков ---
        for (const z of this.spawner.zombies) {
            if (z.alive && z.didScream) {
                this.audio.playAt('scream', z.position.x, z.position.z, px, pz);
            }
        }

        // --- Запах ---
        this.smellTrail.update(dt);

        // --- Debug: сенсоры ---
        this.sensorVisualizer.update(
            this.spawner.zombies,
            this.noise,
            this.player.position,
            dt,
            this.smellTrail
        );

        // --- Камера ---
        this.cameraRig.update(dt, this.player.position, aimPoint);

        // --- Солнце ---
        this.sun.position.set(px + 35, 55, pz + 20);
        this.sun.target.position.copy(this.player.position);
        this.sun.target.updateMatrixWorld();

        // --- Кольцо шума ---
        this.noiseRing.update(this.player.position, this.noise.ownTotal, this.player.dead);

        // --- UI ---
        this.crosshair.update(this.player.position, aimPoint, this.player.dead);
        this.damageIndicator.update(dt);
        this.hud.update(this.player, this.noise);

        this.renderer.render(this.scene, this.camera);
    }

    start() { this.loop.start(); }
    stop()  { this.loop.stop(); }
    isRunning() { return this.loop.running; }
}