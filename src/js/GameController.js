import gameThemes from './themes'; // Переименовали импорт
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
    this.attackArea = []; // Клетки в радиусе атаки
    this.moveArea = []; // Клетки в радиусе перемещения
    this.gameState = {
      level: 1,
      turn: 'player',
      score: 0,
      maxScore: 0,
    };
  }

  init() {
    this.gamePlay.drawUi(gameThemes.prairie); // Использовали переименованный импорт
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

    // Обновляем область атаки
    this.attackArea = getAttackArea(
      this.selectedCell,
      this.selectedCharacter.type,
      8,
    );

    // Обновляем область перемещения (все доступные клетки)
    this.moveArea = [];
    for (let i = 0; i < 64; i++) {
      if (this.canMove(i)) {
        this.moveArea.push(i);
      }
    }
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

      // Обновляем области для подсветки
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
      return false; // Нельзя атаковать своих
    }

    return canAttack(this.selectedCell, targetIndex, this.selectedCharacter.type);
  }

  performMove(fromIndex, toIndex) {
    const charInfo = this.getCharacterAtPosition(fromIndex);
    if (!charInfo) return;

    // Обновляем позицию персонажа
    charInfo.positionedChar.position = toIndex;

    // Снимаем выделение
    this.deselectCharacter();

    // Перерисовываем поле
    this.redraw();

    // Обновляем счет
    this.updateScore();

    // Передаем ход противнику
    this.gameState.turn = 'computer';

    // Логируем перемещение
    console.log(`Персонаж ${charInfo.character.type} перемещен с ${fromIndex} на ${toIndex}`);

    // Ход компьютера
    this.computerTurn();
  }

  performAttack(fromIndex, toIndex) {
    const attackerInfo = this.getCharacterAtPosition(fromIndex);
    const targetInfo = this.getCharacterAtPosition(toIndex);

    if (!attackerInfo || !targetInfo) return;

    const attacker = attackerInfo.character;
    const target = targetInfo.character;

    // Рассчитываем урон
    const damage = calculateDamage(attacker, target);

    // Логируем атаку
    console.log(`${attacker.type} атакует ${target.type}, урон: ${damage.toFixed(1)}`);

    // Наносим урон
    target.health -= damage;

    // Проверяем смерть персонажа
    if (isCharacterDead(target)) {
      target.health = 0;
      console.log(`${target.type} погиб!`);

      // Обновляем счет за убийство
      this.gameState.score += target.level * 10;

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

      // Обновляем максимальный счет
      this.updateMaxScore();

      // Проверяем окончание игры
      if (this.checkGameEnd()) {
        return;
      }

      this.gameState.turn = 'computer';
      this.computerTurn();
    });
  }

  updateScore() {
    // Базовые очки за ход
    this.gameState.score += 1;
  }

  updateMaxScore() {
    if (this.gameState.score > this.gameState.maxScore) {
      this.gameState.maxScore = this.gameState.score;
    }
  }

  checkGameEnd() {
    if (this.playerPositions.length === 0) {
      this.gamePlay.showError(`Игра окончена! Вы проиграли! Очки: ${this.gameState.score}`);
      this.blockGame();
      return true;
    }

    if (this.enemyPositions.length === 0) {
      this.gamePlay.showError(`Поздравляем! Вы победили! Очки: ${this.gameState.score}`);
      this.levelUp();
      return true;
    }

    return false;
  }

  blockGame() {
    // Блокируем игровое поле
    this.gamePlay.addCellEnterListener(() => {});
    this.gamePlay.addCellLeaveListener(() => {});
    this.gamePlay.addCellClickListener(() => {});
  }

  levelUp() {
    // Переход на следующий уровень
    this.gameState.level += 1;

    if (this.gameState.level > 4) {
      this.gamePlay.showError('Вы прошли все уровни! Игра завершена!');
      this.blockGame();
      return;
    }

    // Повышаем уровень выживших персонажей
    this.playerPositions.forEach((pos) => {
      GameController.levelUpCharacter(pos.character); // Использовали статический метод
    });

    // Восстанавливаем здоровье
    this.playerPositions.forEach((pos) => {
      pos.character.health = Math.min(100, pos.character.health + 80);
    });

    // Меняем тему в зависимости от уровня
    const levelThemes = ['prairie', 'desert', 'arctic', 'mountain'];
    const theme = levelThemes[this.gameState.level - 1];
    this.gamePlay.drawUi(theme);

    // Создаем новую команду противника
    const enemyTypes = [Vampire, Undead, Daemon];
    this.enemyTeam = generateTeam(enemyTypes, this.gameState.level, 4);
    this.positionTeams();
    this.redraw();

    // Сбрасываем выделение
    this.deselectCharacter();

    // Начинаем новый раунд
    this.gameState.turn = 'player';
    console.log(`Уровень ${this.gameState.level} начат!`);
  }

  static levelUpCharacter(character) {
    character.level += 1;

    // Увеличиваем характеристики
    const improvement = (80 + character.health) / 100;
    character.attack = Math.max(character.attack, character.attack * improvement);
    character.defence = Math.max(character.defence, character.defence * improvement);

    // Ограничиваем максимальный уровень
    if (character.level > 4) {
      character.level = 4;
    }
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

    // Подсвечиваем область атаки/перемещения
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
    // Снимаем подсветку со всех клеток
    for (let i = 0; i < 64; i++) {
      if (i !== this.selectedCell && i !== index) {
        this.gamePlay.deselectCell(i);
      }
    }

    // Подсвечиваем область перемещения (только если есть выделенный персонаж)
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

      // Если не смогли атаковать, пытаемся переместиться ближе к игроку
      if (!actionPerformed) {
        this.enemyPositions.forEach((enemyPos) => {
          if (actionPerformed) return;

          // Ищем ближайшего игрока
          const nearestPlayer = this.findNearestPlayer(enemyPos);

          if (nearestPlayer) {
            // Пытаемся найти доступную клетку для перемещения ближе к игроку
            const possibleMoves = this.getPossibleMoves(enemyPos);
            const bestMove = GameController.findBestMoveTowardsTarget(
              enemyPos,
              nearestPlayer,
              possibleMoves,
            );

            if (bestMove !== null) {
              this.performComputerMove(enemyPos.position, bestMove);
              actionPerformed = true;
            }
          }
        });
      }

      // Если не смогли сделать ни одного действия, передаем ход
      if (!actionPerformed) {
        this.gameState.turn = 'player';
        console.log('Компьютер пропускает ход');
      }
    }, 1000);
  }

  getPossibleMoves(positionedChar) {
    const possibleMoves = [];
    const { position, character } = positionedChar;

    // Определяем максимальное расстояние перемещения
    let maxMove;
    if (character.type === 'swordsman' || character.type === 'undead') {
      maxMove = 4;
    } else if (character.type === 'bowman' || character.type === 'vampire') {
      maxMove = 2;
    } else {
      maxMove = 1; // magician или daemon
    }

    // Проверяем все клетки в пределах радиуса
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
}
