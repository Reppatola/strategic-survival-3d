// Обёртка над WebGLRenderer.
// Своё дело: рисовать и сообщать другим о ресайзе.
import * as THREE from 'three';

export class Renderer {
    constructor(container) {
        this.container = container;
        this._resizeCallbacks = [];

        this.instance = new THREE.WebGLRenderer({ antialias: true });
        this.instance.setSize(window.innerWidth, window.innerHeight);
        this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.instance.shadowMap.enabled = true;
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap;

        container.appendChild(this.instance.domElement);

        window.addEventListener('resize', () => this._emitResize());
    }

    // Подписка на ресайз: Game обновит aspect камеры
    onResize(callback) {
        this._resizeCallbacks.push(callback);
    }

    _emitResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.instance.setSize(w, h);
        for (const cb of this._resizeCallbacks) cb(w, h);
    }

    render(scene, camera) {
        this.instance.render(scene, camera);
    }
}