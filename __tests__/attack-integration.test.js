import GameController from '../src/js/GameController';
import GamePlay from '../src/js/GamePlay';
import GameStateService from '../src/js/GameStateService';

import * as utils from '../src/js/utils';

// Мокаем только внешние зависимости
jest.mock('../src/js/GamePlay');
jest.mock('../src/js/GameStateService');

// Мокаем утилиты
jest.mock('../src/js/utils', () => ({
  formatCharacterInfo: jest.fn(),
  canMove: jest.fn(),
  canAttack: jest.fn(),
  calculateDamage: jest.fn(),
  isCharacterDead: jest.fn(),
  getAttackArea: jest.fn(),
}));

describe('Task 7 - Attack Integration', () => {
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
          type: 'swordsman',
          attack: 40,
          defence: 10,
          health: 50,
          level: 1,
        },
        position: 0,
      },
    ];

    gameController.enemyPositions = [
      {
        character: {
          type: 'vampire',
          attack: 25,
          defence: 25,
          health: 50,
          level: 1,
        },
        position: 1, // Соседняя клетка
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
      if (index === 1) {
        return {
          character: gameController.enemyPositions[0].character,
          type: 'enemy',
          positionedChar: gameController.enemyPositions[0],
        };
      }
      return null;
    });

    gameController.isCellOccupied = jest.fn((index) => index === 0 || index === 1);

    gameController.redraw = jest.fn();
    gameController.computerTurn = jest.fn();
    gameController.checkGameEnd = jest.fn(() => false);

    // Сбрасываем моки перед каждым тестом
    jest.clearAllMocks();
  });

  test('should perform attack when enemy is in range', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.playerPositions[0].character;

    // Настраиваем моки
    utils.canAttack.mockReturnValue(true);
    utils.calculateDamage.mockReturnValue(15);
    utils.isCharacterDead.mockReturnValue(false);

    // Выполняем атаку
    gameController.performAttack(0, 1);

    // Проверяем, что урон был нанесен
    expect(gameController.enemyPositions[0].character.health).toBe(35); // 50 - 15
    expect(mockGamePlay.showDamage).toHaveBeenCalledWith(1, 15);
  });

  test('should kill enemy when health reaches zero', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.playerPositions[0].character;

    // Настраиваем моки для смертельной атаки
    utils.canAttack.mockReturnValue(true);
    utils.calculateDamage.mockReturnValue(50); // Достаточно для убийства
    utils.isCharacterDead.mockReturnValue(true);

    // Выполняем атаку
    gameController.performAttack(0, 1);

    // Проверяем, что враг удален
    expect(gameController.enemyPositions.length).toBe(0);
  });

  test('should update score when killing enemy', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.playerPositions[0].character;
    gameController.gameState.score = 0;

    // Настраиваем моки
    utils.canAttack.mockReturnValue(true);
    utils.calculateDamage.mockReturnValue(50);
    utils.isCharacterDead.mockReturnValue(true);

    // Выполняем атаку
    gameController.performAttack(0, 1);

    // Проверяем обновление счета (уровень врага 1 * 10 = 10 очков)
    expect(gameController.gameState.score).toBe(10);
  });

  test('should show crosshair cursor when enemy is in attack range', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = { type: 'swordsman' };

    // Враг в радиусе атаки
    utils.canAttack.mockReturnValue(true);

    gameController.updateCursorForCell(1, {
      type: 'enemy',
      character: { type: 'vampire' },
    });

    expect(mockGamePlay.setCursor).toHaveBeenCalledWith('crosshair');
    expect(mockGamePlay.selectCell).toHaveBeenCalledWith(1, 'red');
  });

  test('should show error when trying to attack out of range', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = { type: 'swordsman' };

    // Враг вне радиуса атаки
    utils.canAttack.mockReturnValue(false);

    gameController.attemptAttack(1);

    expect(mockGamePlay.showError).toHaveBeenCalledWith(
      'Невозможно атаковать эту цель!',
    );
  });

  test('should not allow attacking own characters', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = { type: 'swordsman' };

    // Проверяем атаку своего персонажа
    const result = gameController.canAttack(0);

    expect(result).toBe(false);
  });

  test('should calculate damage correctly', () => {
    const attacker = {
      attack: 40, defence: 10, health: 50, level: 1, type: 'swordsman',
    };

    utils.calculateDamage.mockReturnValue(15);

    gameController.selectedCell = 0;
    gameController.selectedCharacter = attacker;

    gameController.performAttack(0, 1);

    // Проверяем, что функция была вызвана с правильными параметрами
    // Используем expect.any для свойств, которые могут измениться
    expect(utils.calculateDamage).toHaveBeenCalledWith(
      expect.objectContaining({
        attack: 40,
        defence: 10,
        type: 'swordsman',
      }),
      expect.objectContaining({
        attack: 25,
        defence: 25,
        type: 'vampire',
      }),
    );
  });

  test('should handle computer attack', () => {
    // Настраиваем моки для атаки компьютера
    utils.calculateDamage.mockReturnValue(20);
    utils.isCharacterDead.mockReturnValue(false);

    gameController.performComputerAttack(1, 0);

    expect(gameController.playerPositions[0].character.health).toBe(30); // 50 - 20
    expect(mockGamePlay.showDamage).toHaveBeenCalledWith(0, 20);
  });

  test('should switch turn after attack', async () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.playerPositions[0].character;

    utils.canAttack.mockReturnValue(true);
    utils.calculateDamage.mockReturnValue(15);
    utils.isCharacterDead.mockReturnValue(false);

    // Мокаем Promise.resolve для showDamage
    mockGamePlay.showDamage.mockResolvedValue();

    // Выполняем атаку
    await gameController.performAttack(0, 1);

    // Проверяем, что ход перешел к компьютеру
    expect(gameController.gameState.turn).toBe('computer');
  });
});
