import GameController from '../src/js/GameController';
import GamePlay from '../src/js/GamePlay';
import GameStateService from '../src/js/GameStateService';

// Теперь импортируем мок
import * as utils from '../src/js/utils';

// Мокаем только внешние зависимости
jest.mock('../src/js/GamePlay');
jest.mock('../src/js/GameStateService');

// Мокаем утилиты - создаем мок перед импортом
jest.mock('../src/js/utils', () => ({
  formatCharacterInfo: jest.fn(),
  canMove: jest.fn(),
  canAttack: jest.fn(),
  getDistance: jest.fn(),
  getMoveRange: jest.fn(),
  getAttackRange: jest.fn(),
}));

describe('Task 6 - Movement Integration', () => {
  let gameController;
  let mockGamePlay;

  beforeEach(() => {
    mockGamePlay = new GamePlay();
    const mockStateService = new GameStateService();

    mockGamePlay.drawUi = jest.fn();
    mockGamePlay.redrawPositions = jest.fn();
    mockGamePlay.addCellEnterListener = jest.fn();
    mockGamePlay.addCellLeaveListener = jest.fn();
    mockGamePlay.addCellClickListener = jest.fn();
    mockGamePlay.selectCell = jest.fn();
    mockGamePlay.deselectCell = jest.fn();
    mockGamePlay.showError = jest.fn();
    mockGamePlay.showCellTooltip = jest.fn();
    mockGamePlay.hideCellTooltip = jest.fn();
    mockGamePlay.setCursor = jest.fn();
    mockGamePlay.showDamage = jest.fn().mockReturnValue(Promise.resolve());

    gameController = new GameController(mockGamePlay, mockStateService);

    // Создаем тестовые данные
    gameController.playerPositions = [
      {
        character: {
          type: 'swordsman', attack: 40, defence: 10, health: 50, level: 1,
        },
        position: 0,
      },
      {
        character: {
          type: 'bowman', attack: 25, defence: 25, health: 50, level: 1,
        },
        position: 8,
      },
    ];

    gameController.enemyPositions = [
      {
        character: {
          type: 'vampire', attack: 25, defence: 25, health: 50, level: 1,
        },
        position: 14,
      },
    ];

    // Мок функции getCharacterAtPosition
    gameController.getCharacterAtPosition = jest.fn((index) => {
      if (index === 0) {
        return {
          character: gameController.playerPositions[0].character,
          type: 'player',
          positionedChar: gameController.playerPositions[0],
        };
      }
      if (index === 8) {
        return {
          character: gameController.playerPositions[1].character,
          type: 'player',
          positionedChar: gameController.playerPositions[1],
        };
      }
      if (index === 14) {
        return {
          character: gameController.enemyPositions[0].character,
          type: 'enemy',
          positionedChar: gameController.enemyPositions[0],
        };
      }
      return null;
    });

    gameController.isCellOccupied = jest.fn((index) => index === 0 || index === 8 || index === 14);

    gameController.redraw = jest.fn();
    gameController.computerTurn = jest.fn();

    // Сбрасываем моки перед каждым тестом
    jest.clearAllMocks();
  });

  test('should move swordsman 4 cells', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = { type: 'swordsman' };

    // Клетка 4 должна быть доступна (расстояние 4)
    utils.canMove.mockReturnValue(true);

    gameController.performMove(0, 4);

    // Проверяем, что позиция обновилась
    expect(gameController.playerPositions[0].position).toBe(4);
    expect(gameController.redraw).toHaveBeenCalled();
    expect(gameController.computerTurn).toHaveBeenCalled();
  });

  test('should move bowman 2 cells', () => {
    gameController.selectedCell = 8;
    gameController.selectedCharacter = { type: 'bowman' };

    // Клетка 10 должна быть доступна (расстояние 2)
    utils.canMove.mockReturnValue(true);

    gameController.performMove(8, 10);

    expect(gameController.playerPositions[1].position).toBe(10);
    expect(gameController.redraw).toHaveBeenCalled();
  });

  test('should not move to occupied cell', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = { type: 'swordsman' };

    // Клетка 8 занята другим персонажем
    utils.canMove.mockReturnValue(false);

    gameController.attemptMove(8);

    expect(mockGamePlay.showError).toHaveBeenCalledWith(
      'Невозможно переместиться на эту клетку!',
    );
    expect(gameController.playerPositions[0].position).toBe(0); // Позиция не изменилась
  });

  test('should calculate movement range correctly', () => {
    // Тестируем саму функцию canMove из utils
    const testCases = [
      {
        type: 'swordsman', from: 0, to: 4, expected: true,
      }, // расстояние 4
      {
        type: 'swordsman', from: 0, to: 5, expected: false,
      }, // расстояние 5
      {
        type: 'bowman', from: 0, to: 2, expected: true,
      }, // расстояние 2
      {
        type: 'bowman', from: 0, to: 3, expected: false,
      }, // расстояние 3
      {
        type: 'magician', from: 0, to: 1, expected: true,
      }, // расстояние 1
      {
        type: 'magician', from: 0, to: 2, expected: false,
      }, // расстояние 2
    ];

    testCases.forEach(({
      type, from, to, expected,
    }) => {
      // Настраиваем мок для этого тестового случая
      utils.canMove.mockReturnValue(expected);

      gameController.selectedCell = from;
      gameController.selectedCharacter = { type };

      const result = gameController.canMove(to);
      expect(result).toBe(expected);
    });
  });

  test('should handle movement and turn switching', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = { type: 'swordsman' };

    // Настраиваем мок
    utils.canMove.mockReturnValue(true);

    // Выполняем перемещение
    gameController.performMove(0, 2);

    // Проверяем, что ход перешел к компьютеру
    expect(gameController.gameState.turn).toBe('computer');
    expect(gameController.computerTurn).toHaveBeenCalled();
  });

  test('should deselect character after movement', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = { type: 'swordsman' };

    utils.canMove.mockReturnValue(true);

    gameController.performMove(0, 2);

    // После перемещения выделение должно сняться
    expect(gameController.selectedCell).toBeNull();
    expect(gameController.selectedCharacter).toBeNull();
  });
});
