import * as THREE from 'three';
import { CAMERA, WORLD, LIGHT } from '../config.js';

export default class Game {
  constructor(container) {
    this.container = container;

    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initLights();
    this.initGround();

    this.timer = new THREE.Timer();

        window.addEventListener('resize', () => this.onResize());
    }

    start() {
        this.animate();
    }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(WORLD.fogColor);
    this.scene.fog = new THREE.Fog(WORLD.fogColor, WORLD.fogNear, WORLD.fogFar);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CAMERA.fov,
      window.innerWidth / window.innerHeight,
      CAMERA.near,
      CAMERA.far
    );
    this.camera.position.set(0, CAMERA.height, 0);
    this.camera.lookAt(0, 0, 0);
  }

  initLights() {
    const ambient = new THREE.HemisphereLight(
      LIGHT.ambientColor,
      LIGHT.ambientGround,
      LIGHT.ambientIntensity
    );
    this.scene.add(ambient);

    this.sun = new THREE.DirectionalLight(LIGHT.sunColor, LIGHT.sunIntensity);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -70;
    this.sun.shadow.camera.right = 70;
    this.sun.shadow.camera.top = 70;
    this.sun.shadow.camera.bottom = -70;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 180;
    this.sun.shadow.bias = -0.0004;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
  }

  initGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD.halfSize * 2 + 40, WORLD.halfSize * 2 + 40),
      new THREE.MeshStandardMaterial({ color: WORLD.groundColor, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.ground = ground;
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.05);
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

    // Камера следует за целью (героем)
    followTarget(target, dt) {
        const lerp = Math.min(1, dt * CAMERA.followLerp);
        this.camera.position.x += (target.position.x - this.camera.position.x) * lerp;
        this.camera.position.z += (target.position.z - this.camera.position.z) * lerp;
        this.camera.position.y = CAMERA.height;
        // Смотрим СТРОГО вниз под себя — vanishing point всегда под героем
        this.camera.lookAt(this.camera.position.x, 0, this.camera.position.z);
    }

  // Переопределяется в наследниках
  update(dt) {}
}