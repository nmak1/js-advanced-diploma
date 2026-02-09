/**
 * Класс, представляющий персонажей команды
 */
export default class Team {
  constructor(characters = []) {
    this.characters = characters;
  }

  add(character) {
    this.characters.push(character);
  }

  remove(character) {
    const index = this.characters.indexOf(character);
    if (index !== -1) {
      this.characters.splice(index, 1);
    }
  }

  get size() {
    return this.characters.length;
  }

  [Symbol.iterator]() {
    let index = 0;
    const { characters } = this;

    return {
      next() {
        if (index < characters.length) {
          return { value: characters[index++], done: false };
        }
        return { done: true };
      },
    };
  }
}
