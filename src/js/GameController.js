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
      return { character: playerChar.character, type: 'player' };
    }

    // Ищем персонажа противника
    const enemyChar = this.enemyPositions.find((pos) => pos.position === index);
    if (enemyChar) {
      return { character: enemyChar.character, type: 'enemy' };
    }

    return null;
  }

  onCellClick(index) {
    // TODO: react to click (будет реализовано в следующей задаче)
    console.log('Cell clicked:', index);
  }

  onCellEnter(index) {
    const charInfo = this.getCharacterAtPosition(index);

    if (charInfo) {
      // Показываем информацию о персонаже
      const formattedInfo = formatCharacterInfo(charInfo.character);
      this.gamePlay.showCellTooltip(formattedInfo, index);

      // Устанавливаем курсор pointer при наведении на персонажа
      this.gamePlay.setCursor(cursors.pointer);
    } else {
      // Скрываем tooltip и устанавливаем стандартный курсор
      this.gamePlay.hideCellTooltip(index);
      this.gamePlay.setCursor(cursors.auto);
    }
  }

  onCellLeave(index) {
    // Скрываем tooltip при уходе мыши с ячейки
    this.gamePlay.hideCellTooltip(index);
    this.gamePlay.setCursor(cursors.auto);
  }
}
