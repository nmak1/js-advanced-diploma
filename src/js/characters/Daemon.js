import Character from '../Character';

export default class Daemon extends Character {
  constructor(level) {
    super(level, 'daemon');
    this.initStats(10, 10);
    if (level > 1) {
      this.levelUpTo(level);
    }
  }
}
