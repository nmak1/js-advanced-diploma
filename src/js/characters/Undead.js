import Character from '../Character';

export default class Undead extends Character {
  constructor(level) {
    super(level, 'undead');
    this.initStats(40, 10);
    if (level > 1) {
      this.levelUpTo(level);
    }
  }
}
