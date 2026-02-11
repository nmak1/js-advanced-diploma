import GamePlay from './GamePlay';
import GameStateService from './GameStateService';
import GameController from './GameController';

console.log('Retro Game initializing...');

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');

  // Создаем контейнер, если его нет
  let container = document.querySelector('.game-container');
  if (!container) {
    console.log('Creating game container');
    container = document.createElement('div');
    container.className = 'game-container';
    document.body.appendChild(container);
  }

  try {
    // Инициализируем игру
    const gamePlay = new GamePlay();
    const stateService = new GameStateService(localStorage);
    const gameController = new GameController(gamePlay, stateService);

    // Привязываем к DOM
    gamePlay.bindToDOM(container);

    // Запускаем
    gameController.init();

    console.log('Game initialized successfully');
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
});
