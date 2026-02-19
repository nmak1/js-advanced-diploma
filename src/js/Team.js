/**
 * Класс, представляющий персонажей команды
 * Использует Set для хранения уникальных персонажей
 */
export default class Team {
  constructor(characters = []) {
    this.characters = new Set(characters);
  }

  /**
   * Добавляет персонажа в команду
   * @param {Character} character - персонаж для добавления
   */
  add(character) {
    this.characters.add(character);
  }

  /**
   * Удаляет персонажа из команды
   * @param {Character} character - персонаж для удаления
   */
  remove(character) {
    this.characters.delete(character);
  }

  /**
   * Проверяет, есть ли персонаж в команде
   * @param {Character} character - персонаж для проверки
   * @returns {boolean}
   */
  has(character) {
    return this.characters.has(character);
  }

  /**
   * Возвращает количество персонажей в команде
   * @returns {number}
   */
  get size() {
    return this.characters.size;
  }

  /**
   * Возвращает массив персонажей
   * @returns {Array}
   */
  toArray() {
    return Array.from(this.characters);
  }

  /**
   * Итератор для возможности использовать for...of
   */
  [Symbol.iterator]() {
    return this.characters[Symbol.iterator]();
  }
}
