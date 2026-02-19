import PositionedCharacter from './PositionedCharacter';
import CharacterFactory from './characters/CharacterFactory';

/**
 * Класс для управления состоянием игры
 * Инкапсулирует все данные и предоставляет методы для их изменения
 */
export default class GameState {
  constructor() {
    this.level = 1;
    this.turn = 'player';
    this.score = 0;
    this.maxScore = 0;
    this.playerPositions = [];
    this.enemyPositions = [];
    this.currentTheme = 'prairie';
    this.isGameBlocked = false;
  }

  /**
   * Обновляет позиции игроков
   * @param {Array} positions - новые позиции
   */
  setPlayerPositions(positions) {
    this.playerPositions = [...positions];
  }

  /**
   * Обновляет позиции врагов
   * @param {Array} positions - новые позиции
   */
  setEnemyPositions(positions) {
    this.enemyPositions = [...positions];
  }

  /**
   * Устанавливает тему
   * @param {string} theme - название темы
   */
  setTheme(theme) {
    this.currentTheme = theme;
  }

  /**
   * Блокирует/разблокирует игру
   * @param {boolean} blocked - состояние блокировки
   */
  setGameBlocked(blocked) {
    this.isGameBlocked = blocked;
  }

  /**
   * Добавляет очки к счету
   * @param {number} points - добавляемые очки
   */
  addScore(points) {
    this.score += points;
    if (this.score > this.maxScore) {
      this.maxScore = this.score;
    }
  }

  /**
   * Проверяет, принадлежит ли персонаж игроку
   * @param {Character} character - персонаж для проверки
   * @returns {boolean}
   */
  isPlayerCharacter(character) {
    return this.playerPositions.some((pos) => pos.character === character);
  }

  /**
   * Проверяет, принадлежит ли персонаж врагу
   * @param {Character} character - персонаж для проверки
   * @returns {boolean}
   */
  isEnemyCharacter(character) {
    return this.enemyPositions.some((pos) => pos.character === character);
  }

  /**
   * Находит персонажа по позиции
   * @param {number} position - индекс клетки
   * @returns {Object|null} - информация о персонаже
   */
  getCharacterAt(position) {
    const playerChar = this.playerPositions.find((pos) => pos.position === position);
    if (playerChar) {
      return {
        character: playerChar.character,
        type: 'player',
        positionedChar: playerChar,
      };
    }

    const enemyChar = this.enemyPositions.find((pos) => pos.position === position);
    if (enemyChar) {
      return {
        character: enemyChar.character,
        type: 'enemy',
        positionedChar: enemyChar,
      };
    }

    return null;
  }

  /**
   * Проверяет, занята ли клетка
   * @param {number} position - индекс клетки
   * @returns {boolean}
   */
  isCellOccupied(position) {
    return this.getCharacterAt(position) !== null;
  }

  /**
   * Обновляет позицию персонажа
   * @param {number} fromIndex - старая позиция
   * @param {number} toIndex - новая позиция
   */
  moveCharacter(fromIndex, toIndex) {
    const allPositions = [...this.playerPositions, ...this.enemyPositions];
    const char = allPositions.find((pos) => pos.position === fromIndex);
    if (char) {
      char.position = toIndex;
    }
  }

  /**
   * Удаляет мертвого персонажа
   * @param {number} position - позиция персонажа
   * @param {string} type - тип ('player' или 'enemy')
   */
  removeCharacter(position, type) {
    if (type === 'player') {
      this.playerPositions = this.playerPositions.filter((pos) => pos.position !== position);
    } else {
      this.enemyPositions = this.enemyPositions.filter((pos) => pos.position !== position);
    }
  }

  /**
   * Создает состояние из сохраненного объекта
   * @param {Object} object - сохраненные данные
   * @returns {GameState}
   */
  static from(object) {
    if (!object) return null;

    const state = new GameState();
    state.level = object.level || 1;
    state.turn = object.turn || 'player';
    state.score = object.score || 0;
    state.maxScore = object.maxScore || 0;
    state.currentTheme = object.currentTheme || 'prairie';

    // Восстанавливаем позиции из сохранения
    state.playerPositions = (object.playerPositions || []).map((posData) => {
      const character = CharacterFactory.fromJSON(posData.character);
      return new PositionedCharacter(character, posData.position);
    });

    state.enemyPositions = (object.enemyPositions || []).map((posData) => {
      const character = CharacterFactory.fromJSON(posData.character);
      return new PositionedCharacter(character, posData.position);
    });

    return state;
  }

  /**
   * Сериализует состояние для сохранения
   * @returns {Object}
   */
  toJSON() {
    return {
      level: this.level,
      turn: this.turn,
      score: this.score,
      maxScore: this.maxScore,
      playerPositions: this.playerPositions.map((pos) => ({
        character: {
          level: pos.character.level,
          attack: pos.character.attack,
          defence: pos.character.defence,
          health: pos.character.health,
          type: pos.character.type,
        },
        position: pos.position,
      })),
      enemyPositions: this.enemyPositions.map((pos) => ({
        character: {
          level: pos.character.level,
          attack: pos.character.attack,
          defence: pos.character.defence,
          health: pos.character.health,
          type: pos.character.type,
        },
        position: pos.position,
      })),
      currentTheme: this.currentTheme,
    };
  }
}
