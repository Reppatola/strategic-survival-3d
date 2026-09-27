import { Game } from './core/Game.js';
import { MainMenu } from './ui/MainMenu.js';
import { GAME } from './config/game.config.js';

const container = document.getElementById('app');

let game = null;
let menu = null;

function startGame() {
    if (!game) {
        // Первый запуск: создаём Game и запоминаем ссылку для отладки
        game = new Game(container, {
            onPlayerDeath: () => {
                // Через 1.5 сек показываем меню с подсвеченной кнопкой «Переиграть»
                setTimeout(() => {
                    if (!menu) return;
                    menu.focusRestart();
                    menu.show();
                }, 1500);
            },
        });
        window.game = game;
    }
    menu.unfocusRestart();
    menu.hide();
    if (!game.isRunning()) game.start();
}

menu = new MainMenu({
    onPlay: startGame,

    onRestart: () => {
        // Простой и надёжный способ — перезагрузить страницу.
        // После reload покажется меню, игрок нажмёт «Играть».
        window.location.reload();
    },

    onExit: () => {
        // Уходим в репозиторий. target=_blank, чтобы не потерять вкладку с игрой.
        window.open(GAME.repoUrl, '_blank', 'noopener');
        // Альтернатива — просто редирект: window.location.href = GAME.repoUrl;
    },
});

// Показать меню при загрузке
menu.show();