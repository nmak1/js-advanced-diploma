import Character from '../Character';

export default class Undead extends Character {
  constructor(level) {
    super(level, 'undead');
    this.initStats(40, 10, 4, 1); // attack, defence, moveRange, attackRange
    if (level > 1) {
      this.levelUpTo(level);
    }
  }
}
