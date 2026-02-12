import GameStateService from '../src/js/GameStateService';
import GameState from '../src/js/GameState';
import GameController from '../src/js/GameController';
import GamePlay from '../src/js/GamePlay';
import Bowman from '../src/js/characters/Bowman';
import Swordsman from '../src/js/characters/Swordsman';
import PositionedCharacter from '../src/js/PositionedCharacter';

jest.mock('../src/js/GamePlay');

describe('GameStateService', () => {
  let storage;
  let stateService;
  let gamePlay;
  let gameController;

  beforeEach(() => {
    storage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    };
    stateService = new GameStateService(storage);
    gamePlay = new GamePlay();
    gameController = new GameController(gamePlay, stateService);

    // Мокаем методы GamePlay
    gamePlay.drawUi = jest.fn();
    gamePlay.redrawPositions = jest.fn();
    gamePlay.showMessage = jest.fn();
    gamePlay.showError = jest.fn();
  });

  test('should save game state', () => {
    // Создаем тестовое состояние
    const state = new GameState();
    state.level = 2;
    state.score = 50;
    state.maxScore = 100;
    state.turn = 'player';

    // Добавляем тестовых персонажей
    const bowman = new Bowman(2);
    bowman.health = 70;
    const swordsman = new Swordsman(1);

    state.playerPositions = [
      new PositionedCharacter(bowman, 10),
      new PositionedCharacter(swordsman, 11),
    ];

    // Сохраняем
    stateService.save(state.toJSON());

    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledWith(
      'state',
      expect.any(String),
    );

    // Проверяем, что сохраняемые данные валидны
    const savedData = JSON.parse(storage.setItem.mock.calls[0][1]);
    expect(savedData.level).toBe(2);
    expect(savedData.score).toBe(50);
    expect(savedData.maxScore).toBe(100);
    expect(savedData.playerPositions).toHaveLength(2);
    expect(savedData.playerPositions[0].character.type).toBe('bowman');
    expect(savedData.playerPositions[0].character.health).toBe(70);
  });

  test('should load game state successfully', () => {
    // Подготавливаем сохраненные данные
    const savedState = {
      level: 3,
      turn: 'player',
      score: 75,
      maxScore: 150,
      currentTheme: 'arctic',
      playerPositions: [
        {
          character: {
            type: 'bowman',
            level: 3,
            health: 85,
            attack: 65,
            defence: 65,
          },
          position: 10,
        },
        {
          character: {
            type: 'magician',
            level: 2,
            health: 82,
            attack: 40,
            defence: 64,
          },
          position: 11,
        },
      ],
      enemyPositions: [
        {
          character: {
            type: 'vampire',
            level: 2,
            health: 82,
            attack: 40,
            defence: 40,
          },
          position: 45,
        },
      ],
    };

    storage.getItem.mockReturnValue(JSON.stringify(savedState));

    const loadedData = stateService.load();
    expect(loadedData).toEqual(savedState);

    // Восстанавливаем состояние через GameController
    gameController.gameState = GameState.from(loadedData);
    gameController.restoreGameState();

    expect(gameController.playerPositions).toHaveLength(2);
    expect(gameController.enemyPositions).toHaveLength(1);
    expect(gameController.playerPositions[0].character.type).toBe('bowman');
    expect(gameController.playerPositions[0].character.health).toBe(85);
    expect(gameController.playerPositions[0].character.attack).toBe(65);
    expect(gameController.gameState.level).toBe(3);
    expect(gameController.gameState.currentTheme).toBe('arctic');
    expect(gamePlay.drawUi).toHaveBeenCalledWith('arctic');
  });

  test('should throw error on invalid state', () => {
    storage.getItem.mockReturnValue('invalid json');

    expect(() => {
      stateService.load();
    }).toThrow('Invalid state');
  });

  test('should handle load error in GameController', () => {
    // Мокаем load чтобы выбросить ошибку
    jest.spyOn(stateService, 'load').mockImplementation(() => {
      throw new Error('Invalid state');
    });

    gameController.loadGame();

    expect(gamePlay.showError).toHaveBeenCalledWith('Ошибка загрузки игры!');
  });

  test('should handle successful load in GameController', () => {
    const savedState = {
      level: 2,
      turn: 'player',
      score: 30,
      maxScore: 100,
      currentTheme: 'desert',
      playerPositions: [],
      enemyPositions: [],
    };

    jest.spyOn(stateService, 'load').mockReturnValue(savedState);

    gameController.loadGame();

    expect(gameController.gameState.level).toBe(2);
    expect(gameController.gameState.score).toBe(30);
    expect(gameController.gameState.maxScore).toBe(100);
    expect(gamePlay.showMessage).toHaveBeenCalledWith('Игра загружена!');
  });

  test('should preserve character health state after load', () => {
    // Создаем персонажа с поврежденным здоровьем
    const damagedBowman = new Bowman(2);
    damagedBowman.health = 45; // Раненый лучник

    const state = new GameState();
    state.playerPositions = [
      new PositionedCharacter(damagedBowman, 10),
    ];

    // Сохраняем
    stateService.save(state.toJSON());

    // Загружаем
    const savedData = JSON.parse(storage.setItem.mock.calls[0][1]);
    storage.getItem.mockReturnValue(JSON.stringify(savedData));

    gameController.gameState = GameState.from(stateService.load());
    gameController.restoreGameState();

    // Проверяем, что здоровье восстановилось правильно
    expect(gameController.playerPositions[0].character.health).toBe(45);
    expect(gameController.playerPositions[0].character.type).toBe('bowman');
  });

  test('should save and restore game turn state', () => {
    const state = new GameState();
    state.turn = 'computer'; // Ход компьютера

    gameController.gameState = state;
    gameController.updateGameState();
    gameController.saveGame();

    const savedData = JSON.parse(storage.setItem.mock.calls[0][1]);
    expect(savedData.turn).toBe('computer');

    storage.getItem.mockReturnValue(JSON.stringify(savedData));
    gameController.loadGame();

    expect(gameController.gameState.turn).toBe('computer');
  });

  test('should handle empty saved state', () => {
    storage.getItem.mockReturnValue(null);

    const result = stateService.load();
    expect(result).toBeNull();

    gameController.loadGame();
    expect(gamePlay.showMessage).not.toHaveBeenCalled();
  });
});
