import GamePlay from '../src/js/GamePlay';
import GameStateService from '../src/js/GameStateService';
import GameController from '../src/js/GameController';
import GameState from '../src/js/GameState';

jest.mock('../src/js/GamePlay');
jest.mock('../src/js/GameStateService');

describe('GameController New Game and Game Over', () => {
  let gamePlay;
  let stateService;
  let gameController;

  beforeEach(() => {
    gamePlay = new GamePlay();
    stateService = new GameStateService();
    gameController = new GameController(gamePlay, stateService);

    // Мокаем методы экземпляра GamePlay
    gamePlay.drawUi = jest.fn();
    gamePlay.redrawPositions = jest.fn();
    gamePlay.addCellEnterListener = jest.fn();
    gamePlay.addCellLeaveListener = jest.fn();
    gamePlay.addCellClickListener = jest.fn();
    gamePlay.addNewGameListener = jest.fn();
    gamePlay.addSaveGameListener = jest.fn();
    gamePlay.addLoadGameListener = jest.fn();
    gamePlay.showError = jest.fn();
    gamePlay.showMessage = jest.fn();
    gamePlay.setCursor = jest.fn();
    gamePlay.deselectCell = jest.fn();
    gamePlay.selectCell = jest.fn();
    gamePlay.showCellTooltip = jest.fn();
    gamePlay.hideCellTooltip = jest.fn();

    // Мокаем статические методы GamePlay
    GamePlay.showError = jest.fn();
    GamePlay.showMessage = jest.fn();

    // Мокаем console.log чтобы не засорять вывод
    jest.spyOn(console, 'log').mockImplementation(() => {});

    // Мокаем confirm
    global.confirm = jest.fn();

    // Инициализируем игру
    gameController.createTeams();
    gameController.positionTeams();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should start new game', () => {
    gameController.newGame();

    expect(gameController.gameState.level).toBe(1);
    expect(gameController.gameState.turn).toBe('player');
    expect(gameController.gameState.score).toBe(0);
    expect(gameController.playerPositions.length).toBeGreaterThan(0);
    expect(gameController.enemyPositions.length).toBeGreaterThan(0);
    expect(gamePlay.drawUi).toHaveBeenCalled();
    expect(gamePlay.redrawPositions).toHaveBeenCalled();
  });

  test('should preserve max score on new game', () => {
    gameController.gameState.maxScore = 100;
    gameController.newGame();

    expect(gameController.gameState.maxScore).toBe(100);
    expect(gameController.gameState.score).toBe(0);
  });

  test('should show game over when no players left', () => {
    gameController.playerPositions = [];
    gameController.gameState.score = 50;
    gameController.gameState.maxScore = 100;

    const result = gameController.checkGameEnd();

    expect(result).toBe(true);
    expect(gamePlay.showMessage).toHaveBeenCalled();
    expect(gameController.isGameBlocked).toBe(true);
  });

  test('should level up when no enemies left and level < 4', () => {
    // Устанавливаем уровень 2
    gameController.gameState.level = 2;
    // Очищаем врагов
    gameController.enemyPositions = [];

    // Мокаем levelUp, чтобы проверить вызов
    const levelUpMock = jest.fn();
    gameController.levelUp = levelUpMock;

    // Мокаем gameOver, чтобы убедиться, что он не вызывается
    const gameOverMock = jest.fn();
    gameController.gameOver = gameOverMock;

    const result = gameController.checkGameEnd();

    expect(result).toBe(true);
    expect(levelUpMock).toHaveBeenCalled();
    expect(gameOverMock).not.toHaveBeenCalled();
  });

  test('should show victory when level 4 completed', () => {
    // Устанавливаем уровень 4
    gameController.gameState.level = 4;
    // Очищаем врагов
    gameController.enemyPositions = [];

    // Мокаем gameOver, чтобы проверить вызов
    const gameOverMock = jest.fn();
    gameController.gameOver = gameOverMock;

    // Мокаем levelUp, чтобы убедиться, что он не вызывается
    const levelUpMock = jest.fn();
    gameController.levelUp = levelUpMock;

    const result = gameController.checkGameEnd();

    expect(result).toBe(true);
    expect(gameOverMock).toHaveBeenCalledWith('Победа');
    expect(levelUpMock).not.toHaveBeenCalled();
  });

  test('should block game on game over', () => {
    gameController.gameOver('Тест');

    expect(gameController.isGameBlocked).toBe(true);
    expect(gamePlay.setCursor).toHaveBeenCalledWith('default');
    expect(gamePlay.showMessage).toHaveBeenCalled();
  });

  test('should not allow moves when game is blocked', () => {
    gameController.isGameBlocked = true;

    gameController.onCellClick(0);

    expect(gamePlay.showError).toHaveBeenCalledWith('Игра завершена. Начните новую игру.');
  });

  test('should save game', () => {
    gameController.gameState = new GameState();
    gameController.gameState.score = 50;
    gameController.gameState.maxScore = 100;
    gameController.saveGame();

    expect(stateService.save).toHaveBeenCalled();
    expect(gamePlay.showMessage).toHaveBeenCalledWith('Игра сохранена!');
  });

  test('should load game', () => {
    const savedState = {
      level: 2,
      score: 30,
      maxScore: 100,
      playerPositions: [],
      enemyPositions: [],
      currentTheme: 'prairie'
    };
    stateService.load.mockReturnValue(savedState);

    gameController.loadGame();

    expect(gameController.gameState.level).toBe(2);
    expect(gameController.gameState.score).toBe(30);
    expect(gameController.gameState.maxScore).toBe(100);
    expect(gamePlay.showMessage).toHaveBeenCalledWith('Игра загружена!');
  });

  test('should handle load error', () => {
    stateService.load.mockImplementation(() => {
      throw new Error('Load error');
    });

    gameController.loadGame();

    expect(gamePlay.showError).toHaveBeenCalledWith('Ошибка загрузки игры!');
  });

  test('should update max score', () => {
    gameController.gameState.score = 150;
    gameController.gameState.maxScore = 100;

    gameController.updateMaxScore();

    expect(gameController.gameState.maxScore).toBe(150);
  });

  test('should not update max score if lower', () => {
    gameController.gameState.score = 50;
    gameController.gameState.maxScore = 100;

    gameController.updateMaxScore();

    expect(gameController.gameState.maxScore).toBe(100);
  });

  test('should handle new game button click with confirmation', () => {
    global.confirm.mockReturnValue(true);
    gameController.newGame = jest.fn();

    gameController.onNewGameClick();

    expect(global.confirm).toHaveBeenCalled();
    expect(gameController.newGame).toHaveBeenCalled();
  });

  test('should not start new game if cancelled', () => {
    global.confirm.mockReturnValue(false);
    gameController.newGame = jest.fn();

    gameController.onNewGameClick();

    expect(global.confirm).toHaveBeenCalled();
    expect(gameController.newGame).not.toHaveBeenCalled();
  });

  test('should handle save game button click', () => {
    gameController.saveGame = jest.fn();

    gameController.onSaveGameClick();

    expect(gameController.saveGame).toHaveBeenCalled();
  });

  test('should handle load game button click with confirmation', () => {
    global.confirm.mockReturnValue(true);
    gameController.loadGame = jest.fn();

    gameController.onLoadGameClick();

    expect(global.confirm).toHaveBeenCalled();
    expect(gameController.loadGame).toHaveBeenCalled();
  });

  test('should not load game if cancelled', () => {
    global.confirm.mockReturnValue(false);
    gameController.loadGame = jest.fn();

    gameController.onLoadGameClick();

    expect(global.confirm).toHaveBeenCalled();
    expect(gameController.loadGame).not.toHaveBeenCalled();
  });
});
