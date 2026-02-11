import { AdvancedAI } from './ai';
import gameThemes from './themes';
import Bowman from './characters/Bowman';
import Swordsman from './characters/Swordsman';
import Magician from './characters/Magician';
import Vampire from './characters/Vampire';
import Undead from './characters/Undead';
import Daemon from './characters/Daemon';
import { generateTeam } from './generators';
import PositionedCharacter from './PositionedCharacter';
import GameState from './GameState'; // Добавляем импорт GameState
import {
  formatCharacterInfo,
  canMove,
  canAttack,
  calculateDamage,
  isCharacterDead,
  getAttackArea,
} from './utils';
import cursors from './cursors';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.playerTeam = null;
    this.enemyTeam = null;
    this.playerPositions = [];
    this.enemyPositions = [];
    this.selectedCell = null;
    this.selectedCharacter = null;
    this.attackArea = [];
    this.moveArea = [];
    this.gameState = new GameState();
    this.isGameBlocked = false;
  }

  init() {
    this.gamePlay.drawUi(gameThemes.prairie);

    // Пытаемся загрузить сохранение
    this.loadGame();

    if (this.playerPositions.length === 0) {
      // Если нет сохранения или оно не загрузилось, создаем новую игру
      this.newGame();
    }

    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));
  }

  createTeams() {
    const playerTypes = [Bowman, Swordsman, Magician];
    const enemyTypes = [Vampire, Undead, Daemon];

    this.playerTeam = generateTeam(playerTypes, 1, 4);
    this.enemyTeam = generateTeam(enemyTypes, 1, 4);
  }

  positionTeams() {
    this.playerPositions = [];
    this.enemyPositions = [];

    const playerColumns = [0, 1];
    const enemyColumns = [6, 7];

    let playerIndex = 0;
    this.playerTeam.characters.forEach((character) => {
      const row = Math.floor(playerIndex / 2);
      const col = playerColumns[playerIndex % 2];
      const position = row * 8 + col;
      this.playerPositions.push(new PositionedCharacter(character, position));
      playerIndex++;
    });

    let enemyIndex = 0;
    this.enemyTeam.characters.forEach((character) => {
      const row = Math.floor(enemyIndex / 2);
      const col = enemyColumns[enemyIndex % 2];
      const position = row * 8 + col;
      this.enemyPositions.push(new PositionedCharacter(character, position));
      enemyIndex++;
    });
  }

  redraw() {
    const allPositions = [...this.playerPositions, ...this.enemyPositions];
    this.gamePlay.redrawPositions(allPositions);
  }

  getCharacterAtPosition(index) {
    const playerChar = this.playerPositions.find((pos) => pos.position === index);
    if (playerChar) {
      return {
        character: playerChar.character,
        type: 'player',
        positionedChar: playerChar,
      };
    }

    const enemyChar = this.enemyPositions.find((pos) => pos.position === index);
    if (enemyChar) {
      return {
        character: enemyChar.character,
        type: 'enemy',
        positionedChar: enemyChar,
      };
    }

    return null;
  }

  isCellOccupied(index) {
    return this.getCharacterAtPosition(index) !== null;
  }

  updateSelectedAreas() {
    if (!this.selectedCharacter || !this.selectedCell) {
      this.attackArea = [];
      this.moveArea = [];
      return;
    }

    this.attackArea = getAttackArea(
      this.selectedCell,
      this.selectedCharacter.type,
      8,
    );

    this.moveArea = [];
    for (let i = 0; i < 64; i++) {
      if (this.canMove(i)) {
        this.moveArea.push(i);
      }
    }
  }

  onCellClick(index) {
    if (this.isGameBlocked) {
      this.gamePlay.showError('Игра завершена. Начните новую игру.');
      return;
    }

    if (this.gameState.turn !== 'player') {
      this.gamePlay.showError('Сейчас ход противника!');
      return;
    }

    const charInfo = this.getCharacterAtPosition(index);

    if (charInfo) {
      if (charInfo.type === 'player') {
        this.selectPlayerCharacter(index, charInfo);
      } else if (this.selectedCharacter) {
        this.attemptAttack(index);
      } else {
        this.gamePlay.showError('Нельзя выбрать персонажа противника!');
      }
    } else if (this.selectedCharacter) {
      this.attemptMove(index);
    } else {
      this.deselectCharacter();
    }
  }

  selectPlayerCharacter(index, charInfo) {
    if (this.selectedCell === index) {
      this.deselectCharacter();
    } else {
      if (this.selectedCell !== null) {
        this.gamePlay.deselectCell(this.selectedCell);
      }
      this.selectedCell = index;
      this.selectedCharacter = charInfo.character;
      this.gamePlay.selectCell(index, 'yellow');
      this.updateSelectedAreas();
    }
  }

  attemptAttack(targetIndex) {
    if (this.canAttack(targetIndex)) {
      this.performAttack(this.selectedCell, targetIndex);
    } else {
      this.gamePlay.showError('Невозможно атаковать эту цель!');
    }
  }

  attemptMove(targetIndex) {
    if (this.canMove(targetIndex)) {
      this.performMove(this.selectedCell, targetIndex);
    } else {
      this.gamePlay.showError('Невозможно переместиться на эту клетку!');
    }
  }

  deselectCharacter() {
    if (this.selectedCell !== null) {
      this.gamePlay.deselectCell(this.selectedCell);
    }
    this.selectedCell = null;
    this.selectedCharacter = null;
    this.attackArea = [];
    this.moveArea = [];
  }

  canMove(toIndex) {
    if (!this.selectedCharacter || this.isCellOccupied(toIndex)) {
      return false;
    }
    return canMove(this.selectedCell, toIndex, this.selectedCharacter.type);
  }

  canAttack(targetIndex) {
    if (!this.selectedCharacter || !this.isCellOccupied(targetIndex)) {
      return false;
    }

    const targetChar = this.getCharacterAtPosition(targetIndex);
    if (!targetChar || targetChar.type === 'player') {
      return false;
    }

    return canAttack(this.selectedCell, targetIndex, this.selectedCharacter.type);
  }

  performMove(fromIndex, toIndex) {
    const charInfo = this.getCharacterAtPosition(fromIndex);
    if (!charInfo) return;

    charInfo.positionedChar.position = toIndex;
    this.deselectCharacter();
    this.redraw();
    this.updateScore();
    this.gameState.turn = 'computer';
    console.log(`Персонаж ${charInfo.character.type} перемещен с ${fromIndex} на ${toIndex}`);
    this.computerTurn();
  }

  performAttack(fromIndex, toIndex) {
    const attackerInfo = this.getCharacterAtPosition(fromIndex);
    const targetInfo = this.getCharacterAtPosition(toIndex);

    if (!attackerInfo || !targetInfo) return;

    const attacker = attackerInfo.character;
    const target = targetInfo.character;

    const damage = calculateDamage(attacker, target);
    console.log(`${attacker.type} атакует ${target.type}, урон: ${damage.toFixed(1)}`);

    target.health -= damage;

    if (isCharacterDead(target)) {
      target.health = 0;
      console.log(`${target.type} погиб!`);
      this.gameState.score += target.level * 10;

      if (targetInfo.type === 'enemy') {
        this.enemyPositions = this.enemyPositions.filter((pos) => pos.position !== toIndex);
      } else {
        this.playerPositions = this.playerPositions.filter((pos) => pos.position !== toIndex);
      }
    }

    this.gamePlay.showDamage(toIndex, Math.round(damage)).then(() => {
      this.redraw();
      this.deselectCharacter();
      this.updateMaxScore();

      if (this.checkGameEnd()) {
        return;
      }

      this.gameState.turn = 'computer';
      this.computerTurn();
    });
  }

  updateScore() {
    this.gameState.score += 1;
  }

  updateMaxScore() {
    if (this.gameState.score > this.gameState.maxScore) {
      this.gameState.maxScore = this.gameState.score;
      console.log(`Новый рекорд! Максимальный счет: ${this.gameState.maxScore}`);
    }
  }

  checkGameEnd() {
    if (this.isGameBlocked) return true;

    if (this.playerPositions.length === 0) {
      this.gameOver('Поражение');
      return true;
    }

    if (this.enemyPositions.length === 0) {
      if (this.gameState.level >= 4) {
        this.gameOver('Победа');
      } else {
        this.levelUp();
      }
      return true;
    }

    return false;
  }

  blockGame() {
    this.isGameBlocked = true;

    // Очищаем все слушатели
    this.gamePlay.cellClickListeners = [];
    this.gamePlay.cellEnterListeners = [];
    this.gamePlay.cellLeaveListeners = [];

    // Добавляем только слушатели для кнопок
    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));

    this.gamePlay.setCursor('default');
    console.log('Игра заблокирована');
  }

  gameOver(reason) {
    this.isGameBlocked = true;
    this.blockGame();

    this.updateMaxScore();

    let message = '';
    if (reason === 'Поражение') {
      message = `Игра окончена! Вы проиграли! Очки: ${this.gameState.score}`;
    } else {
      message = `Поздравляем! Вы прошли все уровни! Финальный счет: ${this.gameState.score}`;
    }

    message += `\nМаксимальный счет: ${this.gameState.maxScore}`;

    this.gamePlay.showMessage(message);
    console.log(`Game Over: ${reason}, Score: ${this.gameState.score}, Max Score: ${this.gameState.maxScore}`);
  }

  levelUp() {
    if (this.gameState.level >= 4) {
      this.gameOver('Победа');
      return;
    }

    this.gameState.level += 1;
    this.levelUpAllSurvivors();
    this.updateTheme();
    this.createEnemyTeamForLevel();
    this.deselectCharacter();
    this.gameState.turn = 'player';

    console.log(`Уровень ${this.gameState.level} начат! Текущий счет: ${this.gameState.score}`);
  }

  levelUpAllSurvivors() {
    this.playerPositions.forEach((pos) => {
      const oldLevel = pos.character.level;
      pos.character.levelUp();
      console.log(
        `Персонаж ${pos.character.type} повышен с уровня ${oldLevel} до ${pos.character.level}. ` +
        `Атака: ${pos.character.attack}, Защита: ${pos.character.defence}, Здоровье: ${pos.character.health}`
      );
    });
  }

  updateTheme() {
    const levelThemes = {
      1: gameThemes.prairie,
      2: gameThemes.desert,
      3: gameThemes.arctic,
      4: gameThemes.mountain,
    };

    const theme = levelThemes[this.gameState.level] || gameThemes.prairie;
    this.gamePlay.drawUi(theme);
  }

  createEnemyTeamForLevel() {
    const enemyTypes = [Vampire, Undead, Daemon];
    const enemyCount = Math.min(3 + this.gameState.level, 6);
    this.enemyTeam = generateTeam(enemyTypes, this.gameState.level, enemyCount);
    this.positionTeams();
    this.redraw();
  }

  onCellEnter(index) {
    const charInfo = this.getCharacterAtPosition(index);

    if (charInfo) {
      const formattedInfo = formatCharacterInfo(charInfo.character);
      this.gamePlay.showCellTooltip(formattedInfo, index);
      this.updateCursorForCell(index, charInfo);
    } else {
      this.gamePlay.hideCellTooltip(index);
      this.updateCursorForEmptyCell(index);
    }

    this.highlightAreas(index);
  }

  updateCursorForCell(index, charInfo) {
    if (charInfo.type === 'player') {
      this.gamePlay.setCursor(cursors.pointer);
    } else if (this.selectedCharacter && this.canAttack(index)) {
      this.gamePlay.setCursor(cursors.crosshair);
      this.gamePlay.selectCell(index, 'red');
    } else {
      this.gamePlay.setCursor(cursors.notallowed);
    }
  }

  updateCursorForEmptyCell(index) {
    if (this.selectedCharacter) {
      if (this.canMove(index)) {
        this.gamePlay.setCursor(cursors.pointer);
        this.gamePlay.selectCell(index, 'green');
      } else {
        this.gamePlay.setCursor(cursors.notallowed);
      }
    } else {
      this.gamePlay.setCursor(cursors.auto);
    }
  }

  highlightAreas(index) {
    for (let i = 0; i < 64; i++) {
      if (i !== this.selectedCell && i !== index) {
        this.gamePlay.deselectCell(i);
      }
    }

    if (this.selectedCharacter) {
      this.moveArea.forEach((cellIndex) => {
        if (cellIndex !== this.selectedCell && cellIndex !== index) {
          this.gamePlay.selectCell(cellIndex, 'green');
        }
      });
    }
  }

  onCellLeave(index) {
    this.gamePlay.hideCellTooltip(index);

    if (index !== this.selectedCell) {
      this.gamePlay.deselectCell(index);
    }

    this.gamePlay.setCursor(cursors.auto);
  }

  computerTurn() {
    setTimeout(() => {
      const action = AdvancedAI.performComputerTurn(
        this.enemyPositions,
        this.playerPositions,
        8,
      );

      if (action) {
        if (action.type === 'attack') {
          this.performComputerAttack(action.fromPosition, action.toPosition);
        } else if (action.type === 'move') {
          this.performComputerMove(action.fromPosition, action.toPosition);
        }
      } else {
        this.gameState.turn = 'player';
        console.log('Компьютер пропускает ход');
      }
    }, 1000);
  }

  performComputerMove(fromIndex, toIndex) {
    const charInfo = this.getCharacterAtPosition(fromIndex);
    if (!charInfo) return;

    charInfo.positionedChar.position = toIndex;
    this.redraw();
    console.log(`Компьютер переместил ${charInfo.character.type} с ${fromIndex} на ${toIndex}`);
    this.gameState.turn = 'player';
  }

  performComputerAttack(fromIndex, toIndex) {
    const attackerInfo = this.getCharacterAtPosition(fromIndex);
    const targetInfo = this.getCharacterAtPosition(toIndex);

    if (!attackerInfo || !targetInfo) return;

    const attacker = attackerInfo.character;
    const target = targetInfo.character;

    const damage = calculateDamage(attacker, target);
    target.health -= damage;

    console.log(`Компьютер: ${attacker.type} атакует ${target.type}, урон: ${damage.toFixed(1)}`);

    if (isCharacterDead(target)) {
      target.health = 0;
      this.playerPositions = this.playerPositions.filter((pos) => pos.position !== toIndex);
      console.log(`${target.type} погиб от атаки компьютера!`);
    }

    this.gamePlay.showDamage(toIndex, Math.round(damage)).then(() => {
      this.redraw();

      if (this.checkGameEnd()) {
        return;
      }

      this.gameState.turn = 'player';
    });
  }

  /**
   * Начинает новую игру
   */
  newGame() {
    // Сохраняем максимальный счет перед сбросом
    const maxScore = this.gameState?.maxScore || 0;

    // Создаем новое состояние
    this.gameState = new GameState();
    this.gameState.maxScore = maxScore;

    // Сбрасываем все поля
    this.isGameBlocked = false;
    this.selectedCell = null;
    this.selectedCharacter = null;
    this.attackArea = [];
    this.moveArea = [];

    // Создаем новые команды
    this.createTeams();
    this.positionTeams();

    // Отрисовываем поле с темой prairie
    this.gamePlay.drawUi(gameThemes.prairie);
    this.redraw();

    console.log(`Новая игра начата! Максимальный счет: ${maxScore}`);
  }

  /**
   * Сохраняет игру
   */
  saveGame() {
    try {
      // Обновляем состояние перед сохранением
      this.updateGameState();
      this.stateService.save(this.gameState.toJSON());
      this.gamePlay.showMessage('Игра сохранена!');
    } catch (e) {
      this.gamePlay.showError('Ошибка сохранения игры!');
    }
  }

  /**
   * Загружает игру
   */
  loadGame() {
    try {
      const savedState = this.stateService.load();
      if (savedState) {
        this.gameState = GameState.from(savedState);
        this.restoreGameState();
        this.gamePlay.showMessage('Игра загружена!');
      }
    } catch (e) {
      this.gamePlay.showError('Ошибка загрузки игры!');
    }
  }

  /**
   * Восстанавливает состояние игры из сохранения
   */
  restoreGameState() {
    console.log('Восстановление состояния игры...');
    // TODO: Реализовать восстановление персонажей из сохраненных данных
    // Эта функция будет реализована в задаче 11
  }

  /**
   * Обновляет состояние игры перед сохранением
   */
  updateGameState() {
    this.gameState.level = this.gameState.level;
    this.gameState.turn = this.gameState.turn;
    this.gameState.score = this.gameState.score;
    this.gameState.maxScore = this.gameState.maxScore;
    this.gameState.playerPositions = [...this.playerPositions];
    this.gameState.enemyPositions = [...this.enemyPositions];

    const levelThemes = {
      1: gameThemes.prairie,
      2: gameThemes.desert,
      3: gameThemes.arctic,
      4: gameThemes.mountain,
    };
    this.gameState.currentTheme = levelThemes[this.gameState.level] || gameThemes.prairie;
  }

  /**
   * Обработчик клика на кнопку New Game
   */
  onNewGameClick() {
    if (confirm('Начать новую игру? Текущий прогресс будет потерян.')) {
      this.newGame();
    }
  }

  /**
   * Обработчик клика на кнопку Save Game
   */
  onSaveGameClick() {
    this.saveGame();
  }

  /**
   * Обработчик клика на кнопку Load Game
   */
  onLoadGameClick() {
    if (confirm('Загрузить сохраненную игру? Текущий прогресс будет потерян.')) {
      this.loadGame();
    }
  }

  getPossibleMoves(positionedChar) {
    const possibleMoves = [];
    const { position, character } = positionedChar;

    let maxMove;
    if (character.type === 'swordsman' || character.type === 'undead') {
      maxMove = 4;
    } else if (character.type === 'bowman' || character.type === 'vampire') {
      maxMove = 2;
    } else {
      maxMove = 1;
    }

    for (let row = -maxMove; row <= maxMove; row++) {
      for (let col = -maxMove; col <= maxMove; col++) {
        const newRow = Math.floor(position / 8) + row;
        const newCol = (position % 8) + col;

        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          const newIndex = newRow * 8 + newCol;
          if (!this.isCellOccupied(newIndex)
              && Math.max(Math.abs(row), Math.abs(col)) <= maxMove) {
            possibleMoves.push(newIndex);
          }
        }
      }
    }

    return possibleMoves;
  }

  findNearestPlayer(enemyPos) {
    let nearestPlayer = null;
    let minDistance = Infinity;

    this.playerPositions.forEach((playerPos) => {
      const distance = Math.abs(
        Math.floor(enemyPos.position / 8) - Math.floor(playerPos.position / 8),
      ) + Math.abs(
        (enemyPos.position % 8) - (playerPos.position % 8),
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPlayer = playerPos;
      }
    });

    return nearestPlayer;
  }

  static findBestMoveTowardsTarget(enemyPos, targetPos, possibleMoves) {
    let bestMove = null;
    let bestDistance = Infinity;

    const targetIndex = targetPos.position;

    possibleMoves.forEach((moveIndex) => {
      const distance = Math.abs(
        Math.floor(moveIndex / 8) - Math.floor(targetIndex / 8),
      ) + Math.abs(
        (moveIndex % 8) - (targetIndex % 8),
      );

      if (distance < bestDistance) {
        bestDistance = distance;
        bestMove = moveIndex;
      }
    });

    return bestMove;
  }
}
