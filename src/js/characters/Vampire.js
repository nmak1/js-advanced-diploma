import Character from '../Character';

export default class Vampire extends Character {
  constructor(level) {
    super(level, 'vampire');
    this.initStats(25, 25, 2, 2); // attack, defence, moveRange, attackRange
    if (level > 1) {
      this.levelUpTo(level);
    }
  }
}
