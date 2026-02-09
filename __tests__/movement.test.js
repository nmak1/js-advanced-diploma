import {
  getDistance,
  getMoveRange,
  getAttackRange,
  canMove,
  canAttack,
} from '../src/js/utils';

describe('Movement and attack utilities', () => {
  describe('getDistance', () => {
    test('should calculate distance correctly for same cell', () => {
      expect(getDistance(0, 0, 8)).toBe(0);
    });

    test('should calculate distance for adjacent cells', () => {
      expect(getDistance(0, 1, 8)).toBe(1); // горизонтально
      expect(getDistance(0, 8, 8)).toBe(1); // вертикально
      expect(getDistance(0, 9, 8)).toBe(1); // диагонально
    });

    test('should calculate distance for far cells', () => {
      expect(getDistance(0, 7, 8)).toBe(7); // по горизонтали
      expect(getDistance(0, 56, 8)).toBe(7); // по вертикали
      expect(getDistance(0, 63, 8)).toBe(7); // по диагонали
      expect(getDistance(9, 14, 8)).toBe(5); // с строке 1 с колонки 1 до колонки 6
    });
  });

  describe('getMoveRange', () => {
    test('should return correct move range for swordsman', () => {
      expect(getMoveRange('swordsman')).toBe(4);
    });

    test('should return correct move range for bowman', () => {
      expect(getMoveRange('bowman')).toBe(2);
    });

    test('should return correct move range for magician', () => {
      expect(getMoveRange('magician')).toBe(1);
    });

    test('should return correct move range for undead', () => {
      expect(getMoveRange('undead')).toBe(4);
    });

    test('should return correct move range for vampire', () => {
      expect(getMoveRange('vampire')).toBe(2);
    });

    test('should return correct move range for daemon', () => {
      expect(getMoveRange('daemon')).toBe(1);
    });

    test('should return 0 for unknown type', () => {
      expect(getMoveRange('unknown')).toBe(0);
    });
  });

  describe('getAttackRange', () => {
    test('should return correct attack range for swordsman', () => {
      expect(getAttackRange('swordsman')).toBe(1);
    });

    test('should return correct attack range for bowman', () => {
      expect(getAttackRange('bowman')).toBe(2);
    });

    test('should return correct attack range for magician', () => {
      expect(getAttackRange('magician')).toBe(4);
    });

    test('should return correct attack range for undead', () => {
      expect(getAttackRange('undead')).toBe(1);
    });

    test('should return correct attack range for vampire', () => {
      expect(getAttackRange('vampire')).toBe(2);
    });

    test('should return correct attack range for daemon', () => {
      expect(getAttackRange('daemon')).toBe(4);
    });
  });

  describe('canMove', () => {
    test('should allow movement within range', () => {
      expect(canMove(0, 1, 'swordsman', 8)).toBe(true); // дистанция 1
      expect(canMove(0, 4, 'swordsman', 8)).toBe(true); // дистанция 4
      expect(canMove(0, 2, 'bowman', 8)).toBe(true); // дистанция 2
      expect(canMove(0, 1, 'magician', 8)).toBe(true); // дистанция 1
    });

    test('should disallow movement beyond range', () => {
      expect(canMove(0, 5, 'swordsman', 8)).toBe(false); // дистанция 5 > 4
      expect(canMove(0, 3, 'bowman', 8)).toBe(false); // дистанция 3 > 2
      expect(canMove(0, 2, 'magician', 8)).toBe(false); // дистанция 2 > 1
    });
  });

  describe('canAttack', () => {
    test('should allow attack within range', () => {
      expect(canAttack(0, 1, 'swordsman', 8)).toBe(true); // дистанция 1
      expect(canAttack(0, 2, 'bowman', 8)).toBe(true); // дистанция 2
      expect(canAttack(0, 4, 'magician', 8)).toBe(true); // дистанция 4
    });

    test('should disallow attack beyond range', () => {
      expect(canAttack(0, 2, 'swordsman', 8)).toBe(false); // дистанция 2 > 1
      expect(canAttack(0, 3, 'bowman', 8)).toBe(false); // дистанция 3 > 2
      expect(canAttack(0, 5, 'magician', 8)).toBe(false); // дистанция 5 > 4
    });
  });
});
