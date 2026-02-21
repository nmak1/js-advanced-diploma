import GamePlay from '../src/js/GamePlay';
import GameStateService from '../src/js/GameStateService';
import GameController from '../src/js/GameController';
import GameState from '../src/js/GameState';
import Team from '../src/js/Team';
import Bowman from '../src/js/characters/Bowman';
import Swordsman from '../src/js/characters/Swordsman';
import Vampire from '../src/js/characters/Vampire';

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

    jest.spyOn(console, 'log').mockImplementation(() => {});
    global.confirm = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should start new game', () => {
    gameController.newGame();

    expect(gameController.gameState.level).toBe(1);
    expect(gameController.gameState.turn).toBe('player');
    expect(gameController.gameState.score).toBe(0);
    expect(gameController.gameState.playerTeam.size).toBeGreaterThan(0);
    expect(gameController.gameState.enemyTeam.size).toBeGreaterThan(0);
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
    // Создаем пустую команду игрока через initializeTeams
    const emptyPlayerTeam = new Team([]);
    const emptyEnemyTeam = new Team([]);
    gameController.gameState.initializeTeams(emptyPlayerTeam, emptyEnemyTeam, [], []);
    gameController.gameState.score = 50;
    gameController.gameState.maxScore = 100;

    // Шпионим за методом gameOver, но не мокаем его, чтобы он выполнился
    const gameOverSpy = jest.spyOn(gameController, 'gameOver');

    const result = gameController.checkGameEnd();

    expect(result).toBe(true);
    expect(gameOverSpy).toHaveBeenCalledWith('Поражение');
    expect(gameController.gameState.isGameBlocked).toBe(true);
  });

  test('should level up when no enemies left and level < 4', () => {
    // Создаем команду игрока с персонажем
    const swordsman = new Swordsman(1);
    const playerTeam = new Team([swordsman]);

    // Создаем пустую команду врагов
    const emptyEnemyTeam = new Team([]);

    // Создаем позиции для игрока
    const playerPositions = [
      { character: swordsman, position: 0 },
    ];

    gameController.gameState.level = 2;
    gameController.gameState.initializeTeams(playerTeam, emptyEnemyTeam, playerPositions, []);

    // Шпионим за методом levelUp
    const levelUpSpy = jest.spyOn(gameController, 'levelUp');

    // Шпионим за методом gameOver, чтобы убедиться, что он не вызывается
    const gameOverSpy = jest.spyOn(gameController, 'gameOver');

    const result = gameController.checkGameEnd();

    expect(result).toBe(true);
    expect(levelUpSpy).toHaveBeenCalled();
    expect(gameOverSpy).not.toHaveBeenCalled();
  });

  test('should show victory when level 4 completed', () => {
    // Создаем команду игрока с персонажем
    const swordsman = new Swordsman(1);
    const playerTeam = new Team([swordsman]);

    // Создаем пустую команду врагов
    const emptyEnemyTeam = new Team([]);

    // Создаем позиции для игрока
    const playerPositions = [
      { character: swordsman, position: 0 },
    ];

    gameController.gameState.level = 4;
    gameController.gameState.initializeTeams(playerTeam, emptyEnemyTeam, playerPositions, []);

    // Шпионим за методом gameOver
    const gameOverSpy = jest.spyOn(gameController, 'gameOver');

    // Шпионим за методом levelUp, чтобы убедиться, что он не вызывается
    const levelUpSpy = jest.spyOn(gameController, 'levelUp');

    const result = gameController.checkGameEnd();

    expect(result).toBe(true);
    expect(gameOverSpy).toHaveBeenCalledWith('Победа');
    expect(levelUpSpy).not.toHaveBeenCalled();
  });

  test('should block game on game over', () => {
    gameController.gameOver('Тест');

    expect(gameController.gameState.isGameBlocked).toBe(true);
    expect(gamePlay.setCursor).toHaveBeenCalledWith('default');
    expect(gamePlay.showMessage).toHaveBeenCalled();
  });

  test('should not allow moves when game is blocked', () => {
    gameController.gameState.setGameBlocked(true);

    gameController.onCellClick(0);

    expect(gamePlay.showError).toHaveBeenCalledWith('Игра завершена. Начните новую игру.');
  });

  test('should save game', () => {
    // Создаем тестовые данные
    const swordsman = new Swordsman(1);
    const playerTeam = new Team([swordsman]);
    const enemyTeam = new Team([]);
    const playerPositions = [{ character: swordsman, position: 0 }];

    gameController.gameState.initializeTeams(playerTeam, enemyTeam, playerPositions, []);
    gameController.gameState.score = 50;
    gameController.gameState.maxScore = 100;

    gameController.saveGame();

    expect(stateService.save).toHaveBeenCalled();
    expect(gamePlay.showMessage).toHaveBeenCalledWith('Игра сохранена!');
  });

  test('should load game', () => {
    const savedState = {
      level: 2,
      turn: 'player',
      score: 30,
      maxScore: 100,
      currentTheme: 'prairie',
      playerPositions: [],
      enemyPositions: [],
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
    const newGameSpy = jest.spyOn(gameController, 'newGame');

    gameController.onNewGameClick();

    expect(global.confirm).toHaveBeenCalled();
    expect(newGameSpy).toHaveBeenCalled();
  });

  test('should not start new game if cancelled', () => {
    global.confirm.mockReturnValue(false);
    const newGameSpy = jest.spyOn(gameController, 'newGame');

    gameController.onNewGameClick();

    expect(global.confirm).toHaveBeenCalled();
    expect(newGameSpy).not.toHaveBeenCalled();
  });

  test('should handle save game button click', () => {
    const saveGameSpy = jest.spyOn(gameController, 'saveGame');

    gameController.onSaveGameClick();

    expect(saveGameSpy).toHaveBeenCalled();
  });

  test('should handle load game button click with confirmation', () => {
    global.confirm.mockReturnValue(true);
    const loadGameSpy = jest.spyOn(gameController, 'loadGame');

    gameController.onLoadGameClick();

    expect(global.confirm).toHaveBeenCalled();
    expect(loadGameSpy).toHaveBeenCalled();
  });

  test('should not load game if cancelled', () => {
    global.confirm.mockReturnValue(false);
    const loadGameSpy = jest.spyOn(gameController, 'loadGame');

    gameController.onLoadGameClick();

    expect(global.confirm).toHaveBeenCalled();
    expect(loadGameSpy).not.toHaveBeenCalled();
  });
});
