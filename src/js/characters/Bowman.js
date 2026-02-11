import Character from '../Character';

export default class Bowman extends Character {
  constructor(level) {
    super(level, 'bowman');
    this.initStats(25, 25);
    if (level > 1) {
      this.levelUpTo(level);
    }
  }
}
