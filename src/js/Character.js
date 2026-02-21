/**
 * Базовый класс, от которого наследуются классы персонажей
 * @property level - уровень персонажа, от 1 до 4
 * @property attack - показатель атаки
 * @property defence - показатель защиты
 * @property health - здоровье персонажа
 * @property type - строка с одним из допустимых значений
 * @property moveRange - дальность перемещения
 * @property attackRange - дальность атаки
 */
export default class Character {
  constructor(level, type = 'generic') {
    if (new.target.name === 'Character') {
      throw new Error('Cannot create instance of Character class directly');
    }

    this.level = 1;
    this.attack = 0;
    this.defence = 0;
    this.health = 50;
    this.type = type;
    this.moveRange = 0;
    this.attackRange = 0;
  }

  /**
   * Инициализация базовых характеристик (должна вызываться из конструкторов наследников)
   */
  initStats(attack, defence, moveRange, attackRange) {
    this.attack = attack;
    this.defence = defence;
    this.moveRange = moveRange;
    this.attackRange = attackRange;
  }

  /**
   * Повышает уровень персонажа до указанного
   */
  levelUpTo(targetLevel) {
    while (this.level < targetLevel && this.level < 4) {
      this.levelUp();
    }
  }

  /**
   * Повышает уровень персонажа на 1
   */
  levelUp() {
    // Увеличиваем уровень на 1
    this.level += 1;

    // Ограничиваем максимальный уровень 4
    if (this.level > 4) {
      this.level = 4;
      return;
    }

    // Восстанавливаем здоровье по формуле: текущий уровень + 80, но не более 100
    this.health = Math.min(this.level + 80, 100);

    // Увеличиваем атаку по формуле
    const attackImprovement = (80 + this.health) / 100;
    this.attack = Math.max(this.attack, Math.floor(this.attack * attackImprovement));

    // Увеличиваем защиту по формуле
    const defenceImprovement = (80 + this.health) / 100;
    this.defence = Math.max(this.defence, Math.floor(this.defence * defenceImprovement));
  }

  /**
   * Проверяет, жив ли персонаж
   */
  isAlive() {
    return this.health > 0;
  }
}
