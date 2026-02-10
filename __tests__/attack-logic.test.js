import {
  calculateDamage,
  isCharacterDead,
  applyDamage,
  getAttackTargets,
  getAttackArea,
} from '../src/js/utils';

describe('Attack Logic Tests', () => {
  describe('calculateDamage', () => {
    test('should calculate damage based on attack and defence', () => {
      const attacker = { attack: 40, defence: 10 };
      const target = { attack: 25, defence: 25 };

      const damage = calculateDamage(attacker, target);
      // 40 - 25 = 15, но минимум 40 * 0.1 = 4
      expect(damage).toBe(15);
    });

    test('should return minimum 10% of attack when defence is high', () => {
      const attacker = { attack: 40, defence: 10 };
      const target = { attack: 25, defence: 100 }; // Очень высокая защита

      const damage = calculateDamage(attacker, target);
      // 40 - 100 = -60, но минимум 40 * 0.1 = 4
      expect(damage).toBe(4);
    });

    test('should work for different character types', () => {
      const testCases = [
        {
          attacker: { attack: 40, defence: 10 }, // swordsman
          target: { attack: 25, defence: 25 }, // vampire
          expected: 15,
        },
        {
          attacker: { attack: 25, defence: 25 }, // bowman
          target: { attack: 40, defence: 10 }, // undead
          expected: 15,
        },
        {
          attacker: { attack: 10, defence: 40 }, // magician
          target: { attack: 10, defence: 40 }, // daemon
          expected: 1, // 10% от 10 = 1
        },
      ];

      testCases.forEach(({ attacker, target, expected }) => {
        const damage = calculateDamage(attacker, target);
        expect(damage).toBe(expected);
      });
    });
  });

  describe('isCharacterDead', () => {
    test('should return true when health is 0 or less', () => {
      expect(isCharacterDead({ health: 0 })).toBe(true);
      expect(isCharacterDead({ health: -10 })).toBe(true);
      expect(isCharacterDead({ health: -0.1 })).toBe(true);
    });

    test('should return false when health is positive', () => {
      expect(isCharacterDead({ health: 1 })).toBe(false);
      expect(isCharacterDead({ health: 50 })).toBe(false);
      expect(isCharacterDead({ health: 100 })).toBe(false);
    });
  });

  describe('applyDamage', () => {
    test('should reduce health by damage amount', () => {
      const character = { health: 50, attack: 25, defence: 25 };
      const damage = 15;

      const result = applyDamage(character, damage);
      expect(result.health).toBe(35);
      expect(result.attack).toBe(25); // Другие свойства не меняются
      expect(result.defence).toBe(25);
    });

    test('should not allow negative health', () => {
      const character = { health: 10 };
      const damage = 20;

      const result = applyDamage(character, damage);
      expect(result.health).toBe(0);
    });

    test('should return new object, not modify original', () => {
      const character = { health: 50 };
      const damage = 10;

      const result = applyDamage(character, damage);
      expect(result).not.toBe(character); // Должен быть новый объект
      expect(character.health).toBe(50); // Оригинал не должен измениться
    });
  });

  describe('getAttackTargets', () => {
    const enemyPositions = [
      { position: 10 },
      { position: 20 },
      { position: 30 },
    ];

    test('should find targets within attack range', () => {
      // Мечник (дистанция атаки 1)
      const targets = getAttackTargets(9, 'swordsman', enemyPositions, 8);
      expect(targets).toContain(10); // На расстоянии 1
      expect(targets).not.toContain(20); // Слишком далеко
      expect(targets).not.toContain(30);
    });

    test('should find all targets for bowman (range 2)', () => {
      const targets = getAttackTargets(8, 'bowman', enemyPositions, 8);
      expect(targets).toContain(10); // На расстоянии 2
      expect(targets).not.toContain(20); // Слишком далеко
      expect(targets).not.toContain(30);
    });

    test('should return empty array if no targets in range', () => {
      const targets = getAttackTargets(0, 'swordsman', enemyPositions, 8);
      expect(targets).toEqual([]);
    });
  });

  describe('getAttackArea', () => {
    test('should return correct area for swordsman (range 1)', () => {
      const area = getAttackArea(36, 'swordsman', 8); // Центр поля

      // Мечник атакует только соседние клетки (включая свою позицию)
      const expected = [
        27, 28, 29,
        35, 36, 37,
        43, 44, 45,
      ];

      expect(area.sort()).toEqual(expected.sort());
    });

    test('should return correct area for bowman (range 2)', () => {
      const area = getAttackArea(0, 'bowman', 8); // Угол поля

      // Лучник атакует в радиусе 2 клеток (включая свою позицию)
      expect(area).toContain(0); // Текущая позиция
      expect(area).toContain(1); // Соседняя справа
      expect(area).toContain(8); // Соседняя снизу
      expect(area).toContain(9); // Диагональ
      expect(area).toContain(2); // Две клетки вправо
      expect(area).toContain(16); // Две клетки вниз

      // Не должно содержать клетки за пределами досягаемости
      expect(area).not.toContain(3); // Три клетки вправо
      expect(area).not.toContain(24); // Три клетки вниз
    });

    test('should handle edge of board', () => {
      const area = getAttackArea(7, 'magician', 8); // Правый верхний угол

      // Маг атакует только соседние клетки (включая свою позицию)
      expect(area).toContain(6); // Лево
      expect(area).toContain(14); // Лево-вниз
      expect(area).toContain(15); // Вниз
      expect(area).toContain(7); // Сама клетка

      // Не должно быть клеток справа или сверху (выход за границы)
      expect(area).not.toContain(8); // Это другой ряд
      expect(area).not.toContain(-1); // Выход за границы
    });
  });
});
