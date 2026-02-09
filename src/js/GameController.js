import themes from './themes';
import Bowman from './characters/Bowman';
import Swordsman from './characters/Swordsman';
import Magician from './characters/Magician';
import Vampire from './characters/Vampire';
import Undead from './characters/Undead';
import Daemon from './characters/Daemon';
import { generateTeam } from './generators';
import PositionedCharacter from './PositionedCharacter';
import { formatCharacterInfo } from './utils';
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
    this.currentPlayer = 'player'; // 'player' или 'computer'
    this.gameState = {
      level: 1,
      turn: 'player',
      score: 0,
    };
  }

  init() {
    // Отрисовываем поле с темой prairie
    this.gamePlay.drawUi(themes.prairie);

    // Создаем команды
    this.createTeams();

    // Размещаем команды на поле
    this.positionTeams();

    // Отрисовываем персонажей
    this.redraw();

    // Подписываемся на события
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
  }

  createTeams() {
    // Классы игрока
    const playerTypes = [Bowman, Swordsman, Magician];
    // Классы противника
    const enemyTypes = [Vampire, Undead, Daemon];

    // Генерируем команды (по 2 персонажа для примера)
    this.playerTeam = generateTeam(playerTypes, 1, 2);
    this.enemyTeam = generateTeam(enemyTypes, 1, 2);
  }

  positionTeams() {
    // Очищаем предыдущие позиции
    this.playerPositions = [];
    this.enemyPositions = [];

    // Позиции для игрока (столбцы 1 и 2)
    const playerColumns = [0, 1];
    // Позиции для противника (столбцы 6 и 7)
    const enemyColumns = [6, 7];

    // Размещаем персонажей игрока
    let playerIndex = 0;
    for (const character of this.playerTeam) {
      const row = Math.floor(playerIndex / 2) * 2; // Размещаем по 2 в строке
      const col = playerColumns[playerIndex % 2];
      const position = row * 8 + col;

      this.playerPositions.push(new PositionedCharacter(character, position));
      playerIndex++;
    }

    // Размещаем персонажей противника
    let enemyIndex = 0;
    for (const character of this.enemyTeam) {
      const row = Math.floor(enemyIndex / 2) * 2;
      const col = enemyColumns[enemyIndex % 2];
      const position = row * 8 + col;

      this.enemyPositions.push(new PositionedCharacter(character, position));
      enemyIndex++;
    }
  }

  redraw() {
    // Объединяем все позиции для отрисовки
    const allPositions = [...this.playerPositions, ...this.enemyPositions];
    this.gamePlay.redrawPositions(allPositions);
  }

  getCharacterAtPosition(index) {
    // Ищем персонажа игрока
    const playerChar = this.playerPositions.find((pos) => pos.position === index);
    if (playerChar) {
      return { character: playerChar.character, type: 'player', positionedChar: playerChar };
    }

    // Ищем персонажа противника
    const enemyChar = this.enemyPositions.find((pos) => pos.position === index);
    if (enemyChar) {
      return { character: enemyChar.character, type: 'enemy', positionedChar: enemyChar };
    }

    return null;
  }

  onCellClick(index) {
    // Проверяем, чей сейчас ход
    if (this.gameState.turn !== 'player') {
      GamePlay.showError('Сейчас ход противника!');
      return;
    }

    const charInfo = this.getCharacterAtPosition(index);

    if (charInfo) {
      // Если кликнули на персонажа
      if (charInfo.type === 'player') {
        // Если кликнули на своего персонажа - выделяем его
        if (this.selectedCell === index) {
          // Если уже выделен - снимаем выделение
          this.gamePlay.deselectCell(this.selectedCell);
          this.selectedCell = null;
        } else {
          // Если другой персонаж - выделяем его
          if (this.selectedCell !== null) {
            this.gamePlay.deselectCell(this.selectedCell);
          }
          this.selectedCell = index;
          this.gamePlay.selectCell(index, 'yellow');
        }
      } else {
        // Если кликнули на персонажа противника - ошибка
        GamePlay.showError('Нельзя выбрать персонажа противника!');
      }
    } else {
      // Если кликнули на пустую клетку
      if (this.selectedCell !== null) {
        // Если есть выделенный персонаж - снимаем выделение
        this.gamePlay.deselectCell(this.selectedCell);
        this.selectedCell = null;
      }
    }
  }

  onCellEnter(index) {
    const charInfo = this.getCharacterAtPosition(index);

    if (charInfo) {
      // Показываем информацию о персонаже
      const formattedInfo = formatCharacterInfo(charInfo.character);
      this.gamePlay.showCellTooltip(formattedInfo, index);

      // Устанавливаем курсор в зависимости от типа персонажа
      if (charInfo.type === 'player') {
        // На своих персонажей - pointer
        this.gamePlay.setCursor(cursors.pointer);
      } else {
        // На персонажей противника - notallowed (если не наш ход)
        if (this.gameState.turn === 'player') {
          this.gamePlay.setCursor(cursors.notallowed);
        } else {
          this.gamePlay.setCursor(cursors.pointer);
        }
      }
    } else {
      // Скрываем tooltip и устанавливаем стандартный курсор
      this.gamePlay.hideCellTooltip(index);
      if (this.selectedCell !== null) {
        // Если есть выделенный персонаж, проверяем можно ли на эту клетку
        this.gamePlay.setCursor(cursors.auto);
      } else {
        this.gamePlay.setCursor(cursors.auto);
      }
    }
  }

  onCellLeave(index) {
    // Скрываем tooltip при уходе мыши с ячейки
    this.gamePlay.hideCellTooltip(index);
    this.gamePlay.setCursor(cursors.auto);
  }
}
