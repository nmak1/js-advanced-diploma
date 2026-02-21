import GameController from '../src/js/GameController';
import GamePlay from '../src/js/GamePlay';
import GameStateService from '../src/js/GameStateService';
import GameState from '../src/js/GameState';
import Team from '../src/js/Team';
import Bowman from '../src/js/characters/Bowman';
import Swordsman from '../src/js/characters/Swordsman';
import Vampire from '../src/js/characters/Vampire';
import * as utils from '../src/js/utils';

jest.mock('../src/js/GamePlay');
jest.mock('../src/js/GameStateService');
jest.mock('../src/js/utils', () => ({
  formatCharacterInfo: jest.fn(),
  canMove: jest.fn(),
  canAttack: jest.fn(),
  calculateDamage: jest.fn(),
  isCharacterDead: jest.fn(),
  getAttackArea: jest.fn(),
  getDistance: jest.fn(),
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
    mockGamePlay.showMessage = jest.fn();
    mockGamePlay.showCellTooltip = jest.fn();
    mockGamePlay.hideCellTooltip = jest.fn();
    mockGamePlay.setCursor = jest.fn();
    mockGamePlay.showDamage = jest.fn().mockReturnValue(Promise.resolve());

    gameController = new GameController(mockGamePlay, mockStateService);
    gameController.gameState = new GameState();

    // Создаем настоящие экземпляры персонажей
    const swordsman = new Swordsman(1);
    swordsman.attack = 40;
    swordsman.defence = 10;
    swordsman.health = 50;
    swordsman.moveRange = 4;
    swordsman.attackRange = 1;

    const vampire = new Vampire(1);
    vampire.attack = 25;
    vampire.defence = 25;
    vampire.health = 50;
    vampire.moveRange = 2;
    vampire.attackRange = 2;

    // Создаем позиции
    const playerPositions = [
      { character: swordsman, position: 0 },
    ];

    const enemyPositions = [
      { character: vampire, position: 1 },
    ];

    // Инициализируем состояние через метод для тестов
    gameController.initializeTestState(playerPositions, enemyPositions);

    gameController.getCharacterAtPosition = jest.fn((index) => {
      return gameController.gameState.getCharacterAt(index);
    });

    gameController.isCellOccupied = jest.fn((index) => {
      return gameController.gameState.isCellOccupied(index);
    });

    gameController.redraw = jest.fn();
    gameController.computerTurn = jest.fn();
    gameController.checkGameEnd = jest.fn(() => false);

    jest.clearAllMocks();
  });

  test('should perform attack when enemy is in range', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.gameState.playerTeam.toArray()[0];

    utils.canAttack.mockReturnValue(true);
    utils.calculateDamage.mockReturnValue(15);
    utils.isCharacterDead.mockReturnValue(false);

    gameController.performAttack(0, 1);

    expect(gameController.gameState.enemyTeam.toArray()[0].health).toBe(35);
    expect(mockGamePlay.showDamage).toHaveBeenCalledWith(1, 15);
  });

  test('should kill enemy when health reaches zero', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.gameState.playerTeam.toArray()[0];

    utils.canAttack.mockReturnValue(true);
    utils.calculateDamage.mockReturnValue(50);
    utils.isCharacterDead.mockReturnValue(true);

    gameController.performAttack(0, 1);

    expect(gameController.gameState.enemyTeam.size).toBe(0);
  });

  test('should update score when killing enemy', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.gameState.playerTeam.toArray()[0];
    gameController.gameState.score = 0;

    utils.canAttack.mockReturnValue(true);
    utils.calculateDamage.mockReturnValue(50);
    utils.isCharacterDead.mockReturnValue(true);

    gameController.performAttack(0, 1);

    expect(gameController.gameState.score).toBe(10);
  });

  test('should show crosshair cursor when enemy is in attack range', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.gameState.playerTeam.toArray()[0];

    // Настраиваем мок для canAttack
    jest.spyOn(gameController, 'canAttack').mockReturnValue(true);

    gameController.updateCursorForCell(1, {
      type: 'enemy',
      character: gameController.gameState.enemyTeam.toArray()[0],
    });

    expect(mockGamePlay.setCursor).toHaveBeenCalledWith('crosshair');
    expect(mockGamePlay.selectCell).toHaveBeenCalledWith(1, 'red');
  });

  test('should show error when trying to attack out of range', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.gameState.playerTeam.toArray()[0];

    // Настраиваем мок для canAttack
    jest.spyOn(gameController, 'canAttack').mockReturnValue(false);

    gameController.attemptAttack(1);

    expect(mockGamePlay.showError).toHaveBeenCalledWith(
      'Невозможно атаковать эту цель!',
    );
  });

  test('should not allow attacking own characters', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.gameState.playerTeam.toArray()[0];

    const result = gameController.canAttack(0);

    expect(result).toBe(false);
  });

  test('should calculate damage correctly', () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.gameState.playerTeam.toArray()[0];

    utils.calculateDamage.mockReturnValue(15);

    gameController.performAttack(0, 1);

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
    utils.calculateDamage.mockReturnValue(20);
    utils.isCharacterDead.mockReturnValue(false);

    gameController.performComputerAttack(1, 0);

    expect(gameController.gameState.playerTeam.toArray()[0].health).toBe(30);
    expect(mockGamePlay.showDamage).toHaveBeenCalledWith(0, 20);
  });

  test('should switch turn after attack', async () => {
    gameController.selectedCell = 0;
    gameController.selectedCharacter = gameController.gameState.playerTeam.toArray()[0];

    utils.canAttack.mockReturnValue(true);
    utils.calculateDamage.mockReturnValue(15);
    utils.isCharacterDead.mockReturnValue(false);

    mockGamePlay.showDamage.mockResolvedValue();

    await gameController.performAttack(0, 1);

    expect(gameController.gameState.turn).toBe('computer');
  });
});
