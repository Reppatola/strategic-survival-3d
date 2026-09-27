// Точка входа. Одна задача: собрать Game и запустить.
import { Game } from './core/Game.js';

const container = document.getElementById('app');
const game = new Game(container);
game.start();

// Удобно для отладки в консоли браузера: window.game.scene, window.game.camera...
window.game = game;