import * as THREE from 'three';
import Game from './Game.js';
import Input from './Input.js';
import Loader from './Loader.js';
import Player from '../entities/Player.js';
import WorldBuilder from '../world/WorldBuilder.js';

export default class GameScene extends Game {
  constructor(container) {
    super(container);

    this.input = new Input();
    this.loader = new Loader();
    this.world = new WorldBuilder(this.scene, this.loader);

    // Герой в центре
    this.player = new Player(this.scene, this.world);

    // HUD
    this.hud = document.getElementById('hud');

        // Мир
        this.buildTestVillage();

        // Запускаем цикл только после того, как всё готово
        this.start();
    }

  async buildTestVillage() {
    await this.world.buildTestVillage();
  }

  update(dt) {
    // Обновляем игрока
    const result = this.player.update(dt, this.input);

    // Камера следит за игроком
    this.followTarget(this.player, dt);

    // Солнце следует за игроком (чтобы тени всегда были)
    this.sun.position.set(
      this.player.position.x + 35,
      55,
      this.player.position.z + 20
    );
    this.sun.target.position.copy(this.player.position);
    this.sun.target.updateMatrixWorld();

    // HUD
    const state = !result.moving ? 'IDLE'
      : this.input.isCrouching() ? 'CROUCH'
      : this.input.isSprinting() ? 'SPRINT'
      : 'WALK';

    this.hud.textContent =
      `STATE ${state}\n` +
      `POS   ${this.player.position.x.toFixed(1)}, ${this.player.position.z.toFixed(1)}`;
  }
}