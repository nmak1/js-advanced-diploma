import AdvancedAI from './ai';
import { getThemeByLevel } from './themes';
import Bowman from './characters/Bowman';
import Swordsman from './characters/Swordsman';
import Magician from './characters/Magician';
import Vampire from './characters/Vampire';
import Undead from './characters/Undead';
import Daemon from './characters/Daemon';
import { generateTeam } from './generators';
import PositionedCharacter from './PositionedCharacter';
import GameState from './GameState';
import {
  formatCharacterInfo,
  canMove,
  canAttack,
  calculateDamage,
  isCharacterDead,
} from './utils';
import cursors from './cursors';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.playerTeam = null;
    this.enemyTeam = null;
    this.selectedCell = null;
    this.selectedCharacter = null;
    this.attackArea = [];
    this.moveArea = [];
    this.gameState = new GameState();
  }

  // Прокси-свойства для обратной совместимости с тестами
  get playerPositions() {
    return this.gameState.playerPositions;
  }

  set playerPositions(value) {
    this.gameState.setPlayerPositions(value);
  }

  get enemyPositions() {
    return this.gameState.enemyPositions;
  }

  set enemyPositions(value) {
    this.gameState.setEnemyPositions(value);
  }

  get isGameBlocked() {
    return this.gameState.isGameBlocked;
  }

  set isGameBlocked(value) {
    this.gameState.setGameBlocked(value);
  }

  get score() {
    return this.gameState.score;
  }

  set score(value) {
    this.gameState.score = value;
  }

  get maxScore() {
    return this.gameState.maxScore;
  }

  set maxScore(value) {
    this.gameState.maxScore = value;
  }

  get level() {
    return this.gameState.level;
  }

  set level(value) {
    this.gameState.level = value;
  }

  get turn() {
    return this.gameState.turn;
  }

  set turn(value) {
    this.gameState.turn = value;
  }

  init() {
    this.loadGame();

    if (this.gameState.playerPositions.length === 0) {
      this.newGame();
    } else {
      this.gamePlay.drawUi(this.gameState.currentTheme);
      this.redraw();
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
    const playerColumns = [0, 1];
    const enemyColumns = [6, 7];
    const playerPositions = [];
    const enemyPositions = [];

    let playerIndex = 0;
    this.playerTeam.toArray().forEach((character) => {
      const row = Math.floor(playerIndex / 2);
      const col = playerColumns[playerIndex % 2];
      const position = row * 8 + col;
      playerPositions.push(new PositionedCharacter(character, position));
      playerIndex++;
    });

    let enemyIndex = 0;
    this.enemyTeam.toArray().forEach((character) => {
      const row = Math.floor(enemyIndex / 2);
      const col = enemyColumns[enemyIndex % 2];
      const position = row * 8 + col;
      enemyPositions.push(new PositionedCharacter(character, position));
      enemyIndex++;
    });

    this.gameState.setPlayerPositions(playerPositions);
    this.gameState.setEnemyPositions(enemyPositions);
  }

  redraw() {
    const allPositions = [
      ...this.gameState.playerPositions,
      ...this.gameState.enemyPositions,
    ];
    this.gamePlay.redrawPositions(allPositions);
  }

  getCharacterAtPosition(index) {
    return this.gameState.getCharacterAt(index);
  }

  isCellOccupied(index) {
    return this.gameState.isCellOccupied(index);
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

  updateSelectedAreas() {
    if (!this.selectedCharacter || !this.selectedCell) {
      this.attackArea = [];
      this.moveArea = [];
      return;
    }

    // Обновляем область атаки
    this.attackArea = [];
    let maxAttack;
    if (this.selectedCharacter.type === 'swordsman' || this.selectedCharacter.type === 'undead') {
      maxAttack = 1;
    } else if (this.selectedCharacter.type === 'bowman' || this.selectedCharacter.type === 'vampire') {
      maxAttack = 2;
    } else {
      maxAttack = 4;
    }

    const fromRow = Math.floor(this.selectedCell / 8);
    const fromCol = this.selectedCell % 8;

    for (let row = fromRow - maxAttack; row <= fromRow + maxAttack; row++) {
      for (let col = fromCol - maxAttack; col <= fromCol + maxAttack; col++) {
        if (row >= 0 && row < 8 && col >= 0 && col < 8) {
          const index = row * 8 + col;
          const distance = Math.max(Math.abs(row - fromRow), Math.abs(col - fromCol));
          if (distance <= maxAttack && index !== this.selectedCell) {
            this.attackArea.push(index);
          }
        }
      }
    }

    // Обновляем область перемещения
    this.moveArea = [];
    for (let i = 0; i < 64; i++) {
      if (this.canMove(i)) {
        this.moveArea.push(i);
      }
    }
  }

  onCellClick(index) {
    if (this.gameState.isGameBlocked) {
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

  performMove(fromIndex, toIndex) {
    const charInfo = this.getCharacterAtPosition(fromIndex);
    if (!charInfo) return;

    this.gameState.moveCharacter(fromIndex, toIndex);
    this.deselectCharacter();
    this.redraw();
    this.gameState.addScore(1);
    this.gameState.turn = 'computer';
    this.computerTurn();
  }

  performAttack(fromIndex, toIndex) {
    const attackerInfo = this.getCharacterAtPosition(fromIndex);
    const targetInfo = this.getCharacterAtPosition(toIndex);

    if (!attackerInfo || !targetInfo) return;

    const attacker = attackerInfo.character;
    const target = targetInfo.character;

    const damage = calculateDamage(attacker, target);
    target.health -= damage;

    if (isCharacterDead(target)) {
      target.health = 0;
      this.gameState.addScore(target.level * 10);
      this.gamePlay.showMessage(`${target.type} повержен! +${target.level * 10} очков`);

      this.gameState.removeCharacter(toIndex, targetInfo.type);
    }

    this.gamePlay.showDamage(toIndex, Math.round(damage)).then(() => {
      this.redraw();
      this.deselectCharacter();

      if (this.checkGameEnd()) {
        return;
      }

      this.gameState.turn = 'computer';
      this.computerTurn();
    });
  }

  updateScore() {
    this.gameState.addScore(1);
  }

  updateMaxScore() {
    if (this.gameState.score > this.gameState.maxScore) {
      this.gameState.maxScore = this.gameState.score;
    }
  }

  checkGameEnd() {
    if (this.gameState.isGameBlocked) return true;

    if (this.gameState.playerPositions.length === 0) {
      this.gameOver('Поражение');
      return true;
    }

    if (this.gameState.enemyPositions.length === 0) {
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
    this.gameState.setGameBlocked(true);

    this.gamePlay.cellClickListeners = [];
    this.gamePlay.cellEnterListeners = [];
    this.gamePlay.cellLeaveListeners = [];

    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));

    this.gamePlay.setCursor('default');
  }

  gameOver(reason) {
    this.blockGame();

    let message = '';
    if (reason === 'Поражение') {
      message = `Игра окончена! Вы проиграли на уровне ${this.gameState.level}!`;
    } else {
      message = 'ПОБЕДА! Вы прошли игру!';
    }

    message += `\nСчет: ${this.gameState.score}`;
    message += `\nМаксимальный счет: ${this.gameState.maxScore}`;
    message += `\nУровень: ${this.gameState.level}`;
    message += `\nУбито врагов: ${Math.floor(this.gameState.score / 10)}`;

    this.gamePlay.showMessage(message);
  }

  levelUp() {
    this.gameState.level += 1;
    const levelBonus = this.gameState.level * 50;
    this.gameState.addScore(levelBonus);

    this.gamePlay.showMessage(`УРОВЕНЬ ${this.gameState.level}! Бонус: +${levelBonus} очков`);

    // Повышаем уровень выживших персонажей
    this.gameState.playerPositions.forEach((pos) => {
      pos.character.levelUp();
    });

    this.updateTheme();
    this.createEnemyTeamForLevel();
    this.deselectCharacter();
    this.gameState.turn = 'player';
  }

  updateTheme() {
    const theme = getThemeByLevel(this.gameState.level);
    this.gamePlay.drawUi(theme);
    this.gameState.setTheme(theme);
  }

  createEnemyTeamForLevel() {
    const enemyTypes = [Vampire, Undead, Daemon];
    const baseCount = 3;
    const additionalCount = Math.floor(this.gameState.level / 2);
    const enemyCount = Math.min(baseCount + additionalCount, 8);
    const enemyMaxLevel = Math.min(this.gameState.level, 10);

    this.enemyTeam = generateTeam(enemyTypes, enemyMaxLevel, enemyCount);
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

      this.attackArea.forEach((cellIndex) => {
        if (cellIndex !== this.selectedCell && cellIndex !== index) {
          if (!this.moveArea.includes(cellIndex)) {
            this.gamePlay.selectCell(cellIndex, 'red');
          }
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
        this.gameState.enemyPositions.map(pos => ({ character: pos.character, position: pos.position })),
        this.gameState.playerPositions.map(pos => ({ character: pos.character, position: pos.position })),
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
        this.gamePlay.showMessage('Компьютер пропускает ход');
      }
    }, 1000);
  }

  performComputerMove(fromIndex, toIndex) {
    this.gameState.moveCharacter(fromIndex, toIndex);
    this.redraw();
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

    if (isCharacterDead(target)) {
      target.health = 0;
      this.gameState.removeCharacter(toIndex, targetInfo.type);
      this.gamePlay.showMessage(`Ваш ${target.type} погиб!`);
    }

    this.gamePlay.showDamage(toIndex, Math.round(damage)).then(() => {
      this.redraw();

      if (this.checkGameEnd()) {
        return;
      }

      this.gameState.turn = 'player';
    });
  }

  newGame() {
    const maxScore = this.gameState?.maxScore || 0;
    this.gameState = new GameState();
    this.gameState.maxScore = maxScore;

    this.selectedCell = null;
    this.selectedCharacter = null;
    this.attackArea = [];
    this.moveArea = [];

    this.createTeams();
    this.positionTeams();

    const theme = getThemeByLevel(1);
    this.gamePlay.drawUi(theme);
    this.redraw();

    this.gamePlay.showMessage(`Новая игра начата! Максимальный счет: ${maxScore}`);
  }

  saveGame() {
    try {
      this.stateService.save(this.gameState.toJSON());
      this.gamePlay.showMessage('Игра сохранена!');
    } catch (e) {
      this.gamePlay.showError('Ошибка сохранения игры!');
    }
  }

  loadGame() {
    try {
      const savedState = this.stateService.load();
      if (savedState) {
        this.gameState = GameState.from(savedState);
        this.redraw();
        this.deselectCharacter();
        this.gamePlay.drawUi(this.gameState.currentTheme);

        // Обновляем команды для совместимости
        this.playerTeam = {
          characters: this.gameState.playerPositions.map(p => p.character),
        };
        this.enemyTeam = {
          characters: this.gameState.enemyPositions.map(p => p.character),
        };

        this.gamePlay.showMessage('Игра загружена!');
      }
    } catch (e) {
      this.gamePlay.showError('Ошибка загрузки игры!');
    }
  }

  restoreGameState() {
    this.redraw();
    this.deselectCharacter();
    this.gamePlay.drawUi(this.gameState.currentTheme);
  }

  updateGameState() {
    // Ничего не делаем, состояние уже обновлено через геттеры/сеттеры
  }

  onNewGameClick() {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Начать новую игру? Текущий прогресс будет потерян.')) {
      this.newGame();
    }
  }

  onSaveGameClick() {
    this.saveGame();
  }

  onLoadGameClick() {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Загрузить сохраненную игру? Текущий прогресс будет потерян.')) {
      this.loadGame();
    }
  }
}
