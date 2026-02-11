import CharacterFactory from './characters/CharacterFactory';
import PositionedCharacter from './PositionedCharacter';

export default class GameState {
  constructor() {
    this.level = 1;
    this.turn = 'player';
    this.score = 0;
    this.maxScore = 0;
    this.playerPositions = [];
    this.enemyPositions = [];
    this.currentTheme = 'prairie';
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
    
    // Восстанавливаем позиции игроков
    state.playerPositions = (object.playerPositions || []).map(posData => {
      const character = CharacterFactory.fromJSON(posData.character);
      return new PositionedCharacter(character, posData.position);
    });
    
    // Восстанавливаем позиции врагов
    state.enemyPositions = (object.enemyPositions || []).map(posData => {
      const character = CharacterFactory.fromJSON(posData.character);
      return new PositionedCharacter(character, posData.position);
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
      playerPositions: this.playerPositions.map(pos => ({
        character: {
          level: pos.character.level,
          attack: pos.character.attack,
          defence: pos.character.defence,
          health: pos.character.health,
          type: pos.character.type,
        },
        position: pos.position,
      })),
      enemyPositions: this.enemyPositions.map(pos => ({
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
