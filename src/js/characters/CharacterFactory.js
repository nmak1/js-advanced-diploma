import Bowman from './Bowman';
import Swordsman from './Swordsman';
import Magician from './Magician';
import Vampire from './Vampire';
import Undead from './Undead';
import Daemon from './Daemon';

/**
 * Фабрика для создания персонажей из сохраненных данных
 */
export default class CharacterFactory {
  /**
   * Создает экземпляр персонажа по типу и уровню
   */
  static create(type, level) {
    switch (type) {
      case 'bowman':
        return new Bowman(level);
      case 'swordsman':
        return new Swordsman(level);
      case 'magician':
        return new Magician(level);
      case 'vampire':
        return new Vampire(level);
      case 'undead':
        return new Undead(level);
      case 'daemon':
        return new Daemon(level);
      default:
        throw new Error(`Unknown character type: ${type}`);
    }
  }

  /**
   * Восстанавливает персонажа из сохраненных данных
   * @param {Object} data - сохраненные данные персонажа
   * @returns {Character} - восстановленный персонаж
   */
  static fromJSON(data) {
    const character = this.create(data.type, data.level);

    // Восстанавливаем текущее состояние (здоровье может быть неполным)
    character.health = data.health;
    character.attack = data.attack;
    character.defence = data.defence;

    return character;
  }
}
