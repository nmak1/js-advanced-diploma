import themes from './themes';
import Bowman from './characters/Bowman';
import Swordsman from './characters/Swordsman';
import Magician from './characters/Magician';
import Vampire from './characters/Vampire';
import Undead from './characters/Undead';
import Daemon from './characters/Daemon';
import { generateTeam } from './generators';
import PositionedCharacter from './PositionedCharacter';
import {
  formatCharacterInfo,
  canMove,
  canAttack,
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
    this.gameState = {
      level: 1,
      turn: 'player',
      score: 0,
    };
  }

  init() {
    this.gamePlay.drawUi(themes.prairie);
    this.createTeams();
    this.positionTeams();
    this.redraw();

    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
  }

  createTeams() {
    const playerTypes = [Bowman, Swordsman, Magician];
    const enemyTypes = [Vampire, Undead, Daemon];

    this.playerTeam = generateTeam(playerTypes, 1, 2);
    this.enemyTeam = generateTeam(enemyTypes, 1, 2);
  }

  positionTeams() {
    this.playerPositions = [];
    this.enemyPositions = [];

    const playerColumns = [0, 1];
    const enemyColumns = [6, 7];

    let playerIndex = 0;
    this.playerTeam.characters.forEach((character) => {
      const row = Math.floor(playerIndex / 2) * 2;
      const col = playerColumns[playerIndex % 2];
      const position = row * 8 + col;
      this.playerPositions.push(new PositionedCharacter(character, position));
      playerIndex++;
    });

    let enemyIndex = 0;
    this.enemyTeam.characters.forEach((character) => {
      const row = Math.floor(enemyIndex / 2) * 2;
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

  onCellClick(index) {
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
      return false; // Нельзя атаковать своих
    }

    return canAttack(this.selectedCell, targetIndex, this.selectedCharacter.type);
  }

  performMove(fromIndex, toIndex) {
    const charInfo = this.getCharacterAtPosition(fromIndex);
    if (!charInfo) return;

    charInfo.positionedChar.position = toIndex;

    this.deselectCharacter();
    this.redraw();

    this.gameState.turn = 'computer';
    this.computerTurn();
  }

  performAttack(fromIndex, toIndex) {
    const attackerInfo = this.getCharacterAtPosition(fromIndex);
    const targetInfo = this.getCharacterAtPosition(toIndex);

    if (!attackerInfo || !targetInfo) return;

    const attacker = attackerInfo.character;
    const target = targetInfo.character;

    // Рассчитываем урон
    const damage = Math.max(attacker.attack - target.defence, attacker.attack * 0.1);

    // Наносим урон
    target.health -= damage;

    // Проверяем смерть персонажа
    if (target.health <= 0) {
      target.health = 0;
      if (targetInfo.type === 'enemy') {
        this.enemyPositions = this.enemyPositions.filter((pos) => pos.position !== toIndex);
      } else {
        this.playerPositions = this.playerPositions.filter((pos) => pos.position !== toIndex);
      }
    }

    // Показываем анимацию урона
    this.gamePlay.showDamage(toIndex, Math.round(damage)).then(() => {
      this.redraw();
      this.deselectCharacter();
      this.gameState.turn = 'computer';
      this.computerTurn();
    });
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

  onCellLeave(index) {
    this.gamePlay.hideCellTooltip(index);

    if (index !== this.selectedCell) {
      this.gamePlay.deselectCell(index);
    }

    this.gamePlay.setCursor(cursors.auto);
  }

  computerTurn() {
    // Простая ИИ логика
    setTimeout(() => {
      let actionPerformed = false;

      // Пытаемся атаковать
      this.enemyPositions.forEach((enemyPos) => {
        if (actionPerformed) return;

        this.playerPositions.forEach((playerPos) => {
          if (actionPerformed) return;

          if (canAttack(
            enemyPos.position,
            playerPos.position,
            enemyPos.character.type,
          )) {
            this.performComputerAttack(enemyPos.position, playerPos.position);
            actionPerformed = true;
          }
        });
      });

      // Если не смогли атаковать, передаем ход
      if (!actionPerformed) {
        this.gameState.turn = 'player';
      }
    }, 1000);
  }

  performComputerAttack(fromIndex, toIndex) {
    const attackerInfo = this.getCharacterAtPosition(fromIndex);
    const targetInfo = this.getCharacterAtPosition(toIndex);

    if (!attackerInfo || !targetInfo) return;

    const attacker = attackerInfo.character;
    const target = targetInfo.character;

    const damage = Math.max(attacker.attack - target.defence, attacker.attack * 0.1);
    target.health -= damage;

    if (target.health <= 0) {
      target.health = 0;
      this.playerPositions = this.playerPositions.filter((pos) => pos.position !== toIndex);
    }

    this.gamePlay.showDamage(toIndex, Math.round(damage)).then(() => {
      this.redraw();
      this.gameState.turn = 'player';
    });
  }
}
