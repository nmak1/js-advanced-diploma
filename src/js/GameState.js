import PositionedCharacter from './PositionedCharacter';
import CharacterFactory from './characters/CharacterFactory';
import Team from './Team';

/**
 * Класс для управления состоянием игры
 * Хранит команды игрока и противника, а также их позиции на поле
 */
export default class GameState {
  constructor() {
    this.level = 1;
    this.turn = 'player';
    this.score = 0;
    this.maxScore = 0;
    this.currentTheme = 'prairie';
    this.isGameBlocked = false;

    // Команды игрока и противника
    this.playerTeam = new Team();
    this.enemyTeam = new Team();

    // Позиции персонажей на поле (для быстрого доступа по индексу)
    this.positionToCharacter = new Map(); // index -> PositionedCharacter
    this.characterToPosition = new Map(); // character -> index
  }

  /**
   * Инициализация команд и их позиций
   */
  initializeTeams(playerTeam, enemyTeam, playerPositions, enemyPositions) {
    this.playerTeam = playerTeam;
    this.enemyTeam = enemyTeam;

    // Очищаем карты позиций
    this.positionToCharacter.clear();
    this.characterToPosition.clear();

    // Заполняем карты позиций для игрока
    playerPositions.forEach(({ character, position }) => {
      const positionedChar = new PositionedCharacter(character, position);
      this.positionToCharacter.set(position, positionedChar);
      this.characterToPosition.set(character, position);
    });

    // Заполняем карты позиций для противника
    enemyPositions.forEach(({ character, position }) => {
      const positionedChar = new PositionedCharacter(character, position);
      this.positionToCharacter.set(position, positionedChar);
      this.characterToPosition.set(character, position);
    });
  }

  /**
   * Проверяет, принадлежит ли персонаж игроку
   */
  isPlayerCharacter(character) {
    return this.playerTeam.has(character);
  }

  /**
   * Проверяет, принадлежит ли персонаж противнику
   */
  isEnemyCharacter(character) {
    return this.enemyTeam.has(character);
  }

  /**
   * Возвращает команду, которой принадлежит персонаж
   */
  getCharacterTeam(character) {
    if (this.playerTeam.has(character)) return 'player';
    if (this.enemyTeam.has(character)) return 'enemy';
    return null;
  }

  /**
   * Находит персонажа по позиции
   */
  getCharacterAt(position) {
    const positionedChar = this.positionToCharacter.get(position);
    if (!positionedChar) return null;

    const team = this.getCharacterTeam(positionedChar.character);
    return {
      character: positionedChar.character,
      type: team,
      positionedChar,
    };
  }

  /**
   * Проверяет, занята ли клетка
   */
  isCellOccupied(position) {
    return this.positionToCharacter.has(position);
  }

  /**
   * Перемещает персонажа
   */
  moveCharacter(character, toIndex) {
    const fromIndex = this.characterToPosition.get(character);
    if (fromIndex === undefined) return false;

    // Обновляем карты позиций
    const positionedChar = this.positionToCharacter.get(fromIndex);
    this.positionToCharacter.delete(fromIndex);
    this.positionToCharacter.set(toIndex, positionedChar);
    this.characterToPosition.set(character, toIndex);

    positionedChar.position = toIndex;
    return true;
  }

  /**
   * Перемещает персонажа по индексам
   */
  moveCharacterByIndex(fromIndex, toIndex) {
    const positionedChar = this.positionToCharacter.get(fromIndex);
    if (!positionedChar) return false;

    return this.moveCharacter(positionedChar.character, toIndex);
  }

  /**
   * Удаляет мертвого персонажа
   */
  removeCharacter(character) {
    const team = this.getCharacterTeam(character);
    if (!team) return false;

    // Удаляем из команды
    if (team === 'player') {
      this.playerTeam.remove(character);
    } else {
      this.enemyTeam.remove(character);
    }

    // Удаляем из карт позиций
    const position = this.characterToPosition.get(character);
    if (position !== undefined) {
      this.positionToCharacter.delete(position);
      this.characterToPosition.delete(character);
    }

    return true;
  }

  /**
   * Удаляет персонажа по позиции
   */
  removeCharacterByPosition(position) {
    const positionedChar = this.positionToCharacter.get(position);
    if (!positionedChar) return false;

    return this.removeCharacter(positionedChar.character);
  }

  /**
   * Возвращает все позиции для отрисовки
   */
  getAllPositions() {
    return Array.from(this.positionToCharacter.values());
  }

  /**
   * Возвращает позицию персонажа
   */
  getCharacterPosition(character) {
    return this.characterToPosition.get(character);
  }

  /**
   * Возвращает позиции игрока для совместимости
   */
  get playerPositions() {
    return Array.from(this.playerTeam).map((character) => ({
      character,
      position: this.getCharacterPosition(character),
    }));
  }

  /**
   * Возвращает позиции противника для совместимости
   */
  get enemyPositions() {
    return Array.from(this.enemyTeam).map((character) => ({
      character,
      position: this.getCharacterPosition(character),
    }));
  }

  /**
   * Добавляет очки к счету
   */
  addScore(points) {
    this.score += points;
    if (this.score > this.maxScore) {
      this.maxScore = this.score;
    }
  }

  /**
   * Устанавливает тему
   */
  setTheme(theme) {
    this.currentTheme = theme;
  }

  /**
   * Блокирует/разблокирует игру
   */
  setGameBlocked(blocked) {
    this.isGameBlocked = blocked;
  }

  /**
   * Повышает уровень всех живых персонажей игрока
   */
  levelUpPlayerTeam() {
    this.playerTeam.levelUpAll();
  }

  /**
   * Создает состояние из сохраненного объекта
   */
  static from(object) {
    if (!object) return null;

    const state = new GameState();
    state.level = object.level || 1;
    state.turn = object.turn || 'player';
    state.score = object.score || 0;
    state.maxScore = object.maxScore || 0;
    state.currentTheme = object.currentTheme || 'prairie';

    // Восстанавливаем команды
    const playerCharacters = [];
    const playerPositions = [];
    const enemyCharacters = [];
    const enemyPositions = [];

    (object.playerPositions || []).forEach((posData) => {
      const character = CharacterFactory.fromJSON(posData.character);
      playerCharacters.push(character);
      playerPositions.push({ character, position: posData.position });
    });

    (object.enemyPositions || []).forEach((posData) => {
      const character = CharacterFactory.fromJSON(posData.character);
      enemyCharacters.push(character);
      enemyPositions.push({ character, position: posData.position });
    });

    state.playerTeam = new Team(playerCharacters);
    state.enemyTeam = new Team(enemyCharacters);

    // Восстанавливаем карты позиций
    state.positionToCharacter.clear();
    state.characterToPosition.clear();

    [...playerPositions, ...enemyPositions].forEach(({ character, position }) => {
      const positionedChar = new PositionedCharacter(character, position);
      state.positionToCharacter.set(position, positionedChar);
      state.characterToPosition.set(character, position);
    });

    return state;
  }

  /**
   * Сериализует состояние для сохранения
   */
  toJSON() {
    return {
      level: this.level,
      turn: this.turn,
      score: this.score,
      maxScore: this.maxScore,
      currentTheme: this.currentTheme,
      playerPositions: this.playerPositions.map(({ character, position }) => ({
        character: {
          level: character.level,
          attack: character.attack,
          defence: character.defence,
          health: character.health,
          type: character.type,
          moveRange: character.moveRange,
          attackRange: character.attackRange,
        },
        position,
      })),
      enemyPositions: this.enemyPositions.map(({ character, position }) => ({
        character: {
          level: character.level,
          attack: character.attack,
          defence: character.defence,
          health: character.health,
          type: character.type,
          moveRange: character.moveRange,
          attackRange: character.attackRange,
        },
        position,
      })),
    };
  }
}
