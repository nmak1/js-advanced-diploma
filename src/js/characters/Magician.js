import Character from '../Character';

export default class Magician extends Character {
  constructor(level) {
    super(level, 'magician');
    this.initStats(10, 40);
    if (level > 1) {
      this.levelUpTo(level);
    }
  }
}
