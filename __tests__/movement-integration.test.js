import GameController from '../src/js/GameController';
import GamePlay from '../src/js/GamePlay';
import GameStateService from '../src/js/GameStateService';
import GameState from '../src/js/GameState';
import Team from '../src/js/Team';
import Swordsman from '../src/js/characters/Swordsman';
import Bowman from '../src/js/characters/Bowman';
import Vampire from '../src/js/characters/Vampire';
import * as utils from '../src/js/utils';

jest.mock('../src/js/GamePlay');
jest.mock('../src/js/GameStateService');
jest.mock('../src/js/utils', () => ({
  formatCharacterInfo: jest.fn(),
  canMove: jest.fn(),
  canAttack: jest.fn(),
  getDistance: jest.fn(),
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
    mockGamePlay.showMessage = jest.fn();
    mockGamePlay.showCellTooltip = jest.fn();
    mockGamePlay.hideCellTooltip = jest.fn();
    mockGamePlay.setCursor = jest.fn();
    mockGamePlay.showDamage = jest.fn().mockReturnValue(Promise.resolve());

    gameController = new GameController(mockGamePlay, mockStateService);
    gameController.gameState = new GameState();

    // Создаем настоящие экземпляры персонажей
    const swordsman = new Swordsman(1);
    const bowman = new Bowman(1);
    const vampire = new Vampire(1);

    // Создаем позиции
    const playerPositions = [
      { character: swordsman, position: 0 },
      { character: bowman, position: 8 },
    ];

    const enemyPositions = [
      { character: vampire, position: 14 },
    ];

    // Инициализируем состояние
    gameController.initializeTestState(playerPositions, enemyPositions);

    gameController.getCharacterAtPosition = jest.fn((index) => {
      return gameController.gameState.getCharacterAt(index);
    });

    gameController.isCellOccupied = jest.fn((index) => {
      return gameController.gameState.isCellOccupied(index);
    });

    gameController.redraw = jest.fn();
    gameController.computerTurn = jest.fn();

    jest.clearAllMocks();
  });

  test('should move swordsman 4 cells', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.gameState.playerTeam.toArray()[0];

    // Настраиваем мок для getDistance
    utils.getDistance.mockReturnValue(4);

    gameController.performMove(0, 4);

    expect(gameController.gameState.getCharacterPosition(
      gameController.gameState.playerTeam.toArray()[0]
    )).toBe(4);
    expect(gameController.redraw).toHaveBeenCalled();
    expect(gameController.computerTurn).toHaveBeenCalled();
  });

  test('should move bowman 2 cells', () => {
    gameController.selectedCell = 8;
    gameController.selectedCharacter = gameController.gameState.playerTeam.toArray()[1];

    utils.getDistance.mockReturnValue(2);

    gameController.performMove(8, 10);

    expect(gameController.gameState.getCharacterPosition(
      gameController.gameState.playerTeam.toArray()[1]
    )).toBe(10);
    expect(gameController.redraw).toHaveBeenCalled();
  });

  test('should not move to occupied cell', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.gameState.playerTeam.toArray()[0];

    // Клетка 8 занята
    gameController.attemptMove(8);

    expect(mockGamePlay.showError).toHaveBeenCalledWith(
      'Невозможно переместиться на эту клетку!',
    );
    expect(gameController.gameState.getCharacterPosition(
      gameController.gameState.playerTeam.toArray()[0]
    )).toBe(0);
  });

  test('should calculate movement range correctly', () => {
    const testCases = [
      { type: 'swordsman', from: 0, to: 4, expected: true },  // расстояние 4
      { type: 'swordsman', from: 0, to: 5, expected: false }, // расстояние 5
      { type: 'bowman', from: 0, to: 2, expected: true },     // расстояние 2
      { type: 'bowman', from: 0, to: 3, expected: false },    // расстояние 3
      { type: 'magician', from: 0, to: 1, expected: true },   // расстояние 1
      { type: 'magician', from: 0, to: 2, expected: false },  // расстояние 2
    ];

    testCases.forEach(({ type, from, to, expected }) => {
      // Создаем персонажа с нужными характеристиками
      const character = {
        type,
        moveRange: type === 'swordsman' ? 4 : (type === 'bowman' ? 2 : 1),
      };

      gameController.selectedCell = from;
      gameController.selectedCharacter = character;

      // Настраиваем мок getDistance
      utils.getDistance.mockReturnValue(
        type === 'swordsman' ? (to === 4 ? 4 : 5) : (type === 'bowman' ? (to === 2 ? 2 : 3) : (to === 1 ? 1 : 2))
      );

      const result = gameController.canMove(to);
      expect(result).toBe(expected);
    });
  });

  test('should handle movement and turn switching', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.gameState.playerTeam.toArray()[0];

    utils.getDistance.mockReturnValue(2);

    gameController.performMove(0, 2);

    expect(gameController.gameState.turn).toBe('computer');
    expect(gameController.computerTurn).toHaveBeenCalled();
  });

  test('should deselect character after movement', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.gameState.playerTeam.toArray()[0];

    utils.getDistance.mockReturnValue(2);

    gameController.performMove(0, 2);

    expect(gameController.selectedCell).toBeNull();
    expect(gameController.selectedCharacter).toBeNull();
  });
});
