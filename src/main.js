import { Game } from './core/Game.js';
import { MainMenu } from './ui/MainMenu.js';
import { GameOverOverlay } from './ui/GameOverOverlay.js';
import { GAME } from './config/game.config.js';

const container = document.getElementById('app');
const AUTOSTART_KEY = 'ss_autostart';

let game = null;
let menu = null;
let gameOver = null;

function startGame() {
    if (!game) {
        game = new Game(container, {
            onPlayerDeath: () => {
                setTimeout(() => {
                    game.stop();
                    gameOver.show({ win: false });
                }, 1200);
            },
            onVictory: () => {
                setTimeout(() => {
                    game.stop();
                    gameOver.show({ win: true });
                }, 800);
            },
        });
        window.game = game;
    }
    menu.hide();
    gameOver.hide();
    if (!game.isRunning()) game.start();
}

function restartGame() {
    // Перезагрузка страницы + флаг автозапуска
    localStorage.setItem(AUTOSTART_KEY, '1');
    window.location.reload();
}

function backToMenu() {
    localStorage.removeItem(AUTOSTART_KEY);
    window.location.reload();
}

menu = new MainMenu({
    onPlay: startGame,
    onRestart: restartGame,
    onExit: () => window.open(GAME.repoUrl, '_blank', 'noopener'),
});

gameOver = new GameOverOverlay({
    onRestart: restartGame,
    onMenu: backToMenu,
});

// Если в прошлой сессии нажали «Переиграть» — стартуем сразу
if (localStorage.getItem(AUTOSTART_KEY) === '1') {
    localStorage.removeItem(AUTOSTART_KEY);
    startGame();
} else {
    menu.show();
}