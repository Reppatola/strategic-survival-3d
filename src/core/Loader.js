import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default class Loader {
  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.cache = new Map();
  }

  // Загружает модель и возвращает Promise с готовым объектом
  load(url) {
    if (this.cache.has(url)) {
      return Promise.resolve(this.cache.get(url).clone());
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          this.cache.set(url, gltf.scene);
          resolve(gltf.scene.clone());
        },
        undefined,
        (error) => {
          console.error('Ошибка загрузки:', url, error);
          reject(error);
        }
      );
    });
  }
}