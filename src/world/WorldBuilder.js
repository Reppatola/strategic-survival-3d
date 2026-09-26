import * as THREE from 'three';

export default class WorldBuilder {
  constructor(scene, loader) {
    this.scene = scene;
    this.loader = loader;
    this.buildings = [];
    this.colliders = [];   // ← границы зданий для коллизий
  }

  async placeBuilding(url, x, z, scale = 1, rotationY = 0) {
    try {
      const model = await this.loader.load(url);

      model.position.set(x, 0, z);
      model.scale.setScalar(scale);
      model.rotation.y = rotationY;

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(model);
      this.buildings.push(model);

      // === Сохраняем границы для коллизий ===
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      this.colliders.push({
        minX: box.min.x,
        maxX: box.max.x,
        minZ: box.min.z,
        maxZ: box.max.z,
      });

      return model;
    } catch (err) {
      console.error('Не удалось разместить здание:', err);
    }
  }

  // Проверка: пересекается ли круг (x, z, radius) с каким-либо зданием
  isBlocked(x, z, radius = 0.4) {
    for (const c of this.colliders) {
      if (
        x + radius > c.minX &&
        x - radius < c.maxX &&
        z + radius > c.minZ &&
        z - radius < c.maxZ
      ) {
        return true;
      }
    }
    return false;
  }

  async buildTestVillage() {
    const buildings = [
      { url: 'assets/models/buildings/1Story_GableRoof_Mat.glb', x: -6, z: -6 },
      { url: 'assets/models/buildings/2Story_2_Mat.glb', x: 6, z: -6 },
      { url: 'assets/models/buildings/2Story_Balcony_Mat.glb', x: -6, z: 6 },
      { url: 'assets/models/buildings/3Story_Small_Mat.glb', x: 6, z: 6 },
    ];

    for (const b of buildings) {
      await this.placeBuilding(b.url, b.x, b.z);
    }

    console.log('Тестовая деревня построена. Коллайдеров:', this.colliders.length);
  }
}