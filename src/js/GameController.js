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
    this.loadGame();

    if (this.playerPositions.length === 0) {
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
      this.gameState.score += target.level * 10;
      this.gamePlay.showMessage(`${target.type} повержен! +${target.level * 10} очков`);

      if (targetInfo.type === 'enemy') {
        this.enemyPositions = this.enemyPositions.filter(
          (pos) => pos.position !== toIndex,
        );
      } else {
        this.playerPositions = this.playerPositions.filter(
          (pos) => pos.position !== toIndex,
        );
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
      this.gamePlay.showMessage(`НОВЫЙ РЕКОРД! Максимальный счет: ${this.gameState.maxScore}`);
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

    this.gamePlay.cellClickListeners = [];
    this.gamePlay.cellEnterListeners = [];
    this.gamePlay.cellLeaveListeners = [];

    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));

    this.gamePlay.setCursor('default');
  }

  gameOver(reason) {
    this.isGameBlocked = true;
    this.blockGame();
    this.updateMaxScore();

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
    this.gameState.score += levelBonus;

    this.gamePlay.showMessage(`УРОВЕНЬ ${this.gameState.level}! Бонус: +${levelBonus} очков`);

    this.levelUpAllSurvivors();
    this.updateTheme();
    this.createEnemyTeamForLevel();
    this.deselectCharacter();
    this.gameState.turn = 'player';
  }

  levelUpAllSurvivors() {
    this.playerPositions.forEach((pos) => {
      pos.character.levelUp();
    });
  }

  updateTheme() {
    const theme = getThemeByLevel(this.gameState.level);
    this.gamePlay.drawUi(theme);
    this.gameState.currentTheme = theme;
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
        this.gamePlay.showMessage('Компьютер пропускает ход');
      }
    }, 1000);
  }

  performComputerMove(fromIndex, toIndex) {
    const charInfo = this.getCharacterAtPosition(fromIndex);
    if (!charInfo) return;

    charInfo.positionedChar.position = toIndex;
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
      this.playerPositions = this.playerPositions.filter(
        (pos) => pos.position !== toIndex,
      );
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

    this.isGameBlocked = false;
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
      this.updateGameState();
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
        this.restoreGameState();
        this.gamePlay.showMessage('Игра загружена!');
      }
    } catch (e) {
      this.gamePlay.showError('Ошибка загрузки игры!');
    }
  }

  restoreGameState() {
    this.playerPositions = this.gameState.playerPositions;
    this.enemyPositions = this.gameState.enemyPositions;

    this.gamePlay.drawUi(this.gameState.currentTheme);
    this.redraw();

    this.deselectCharacter();
    this.isGameBlocked = false;

    this.playerTeam = {
      characters: this.playerPositions.map((p) => p.character),
    };
    this.enemyTeam = {
      characters: this.enemyPositions.map((p) => p.character),
    };
  }

  updateGameState() {
    this.gameState.playerPositions = [...this.playerPositions];
    this.gameState.enemyPositions = [...this.enemyPositions];
    this.gameState.currentTheme = getThemeByLevel(this.gameState.level);
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
