import Character from '../src/js/Character';
import Bowman from '../src/js/characters/Bowman';
import Swordsman from '../src/js/characters/Swordsman';
import Magician from '../src/js/characters/Magician';
import Vampire from '../src/js/characters/Vampire';
import Undead from '../src/js/characters/Undead';
import Daemon from '../src/js/characters/Daemon';

describe('Character level up', () => {
  describe('levelUp method', () => {
    test('should increase level by 1', () => {
      const character = new Bowman(1);
      const oldLevel = character.level;

      character.levelUp();

      expect(character.level).toBe(oldLevel + 1);
    });

    test('should not exceed level 4', () => {
      const character = new Bowman(4);

      character.levelUp();

      expect(character.level).toBe(4);
    });

    test('should restore health to level + 80, not exceeding 100', () => {
      const character = new Bowman(1);
      character.health = 30;

      character.levelUp();

      expect(character.health).toBe(82); // level 2 + 80
    });

    test('should not exceed 100 health', () => {
      const character = new Bowman(3);
      character.health = 90;

      character.levelUp();

      expect(character.health).toBe(84); // level 4 + 80
      expect(character.health).toBeLessThanOrEqual(100);
    });

    test('should improve attack according to formula', () => {
      const character = new Bowman(1);
      const oldAttack = character.attack; // 25

      character.levelUp();

      // Уровень становится 2
      // health становится 2 + 80 = 82
      // Формула: Math.max(oldAttack, oldAttack * (80 + health) / 100)
      // oldAttack = 25, health = 82
      // 25 * (80 + 82) / 100 = 25 * 162 / 100 = 40.5
      // Math.max(25, 40.5) = 40.5, Math.floor = 40
      expect(character.attack).toBe(40);
    });

    test('should not decrease attack', () => {
      const character = new Bowman(1);
      const oldAttack = character.attack;

      character.levelUp();

      expect(character.attack).toBeGreaterThanOrEqual(oldAttack);
    });

    test('should improve defence according to formula', () => {
      const character = new Bowman(1);
      const oldDefence = character.defence; // 25

      character.levelUp();

      expect(character.defence).toBe(40);
    });

    test('should not decrease defence', () => {
      const character = new Bowman(1);
      const oldDefence = character.defence;

      character.levelUp();

      expect(character.defence).toBeGreaterThanOrEqual(oldDefence);
    });
  });

  describe('Constructor with level > 1', () => {
    test('should create character with level 2 and correct stats', () => {
      const character = new Bowman(2);

      expect(character.level).toBe(2);
      expect(character.health).toBe(82); // 2 + 80
      expect(character.attack).toBe(40); // 25 * 162 / 100 = 40.5 -> 40
      expect(character.defence).toBe(40); // 25 * 162 / 100 = 40.5 -> 40
    });

    test('should create character with level 3 and correct stats', () => {
      const character = new Bowman(3);

      expect(character.level).toBe(3);
      expect(character.health).toBe(83); // 3 + 80

      // Расчет для уровня 3:
      // Уровень 2: attack = 40, defence = 40, health = 82
      // Уровень 3:
      // health = 3 + 80 = 83
      // attack = Math.max(40, 40 * (80 + 83) / 100) = Math.max(40, 40 * 163 / 100) = Math.max(40, 65.2) = 65.2 -> 65
      // defence = аналогично = 65
      expect(character.attack).toBe(65);
      expect(character.defence).toBe(65);
    });

    test('should create character with level 4 and correct stats', () => {
      const character = new Bowman(4);

      expect(character.level).toBe(4);
      expect(character.health).toBe(84); // 4 + 80
      expect(character.attack).toBe(106); // Расчетный
      expect(character.defence).toBe(106); // Расчетный
    });
  });

  describe('isAlive method', () => {
    test('should return true when health > 0', () => {
      const character = new Bowman(1);
      character.health = 50;

      expect(character.isAlive()).toBe(true);
    });

    test('should return false when health <= 0', () => {
      const character = new Bowman(1);
      character.health = 0;

      expect(character.isAlive()).toBe(false);
    });
  });

  describe('All character classes', () => {
    test('Bowman should level up correctly', () => {
      const character = new Bowman(1);
      const oldLevel = character.level;
      const oldAttack = character.attack;
      const oldDefence = character.defence;

      character.levelUp();

      expect(character.level).toBe(oldLevel + 1);
      expect(character.attack).toBeGreaterThan(oldAttack);
      expect(character.defence).toBeGreaterThan(oldDefence);
      expect(character.health).toBe(82);
    });

    test('Swordsman should level up correctly', () => {
      const character = new Swordsman(1);
      const oldAttack = character.attack; // 40

      character.levelUp();

      expect(character.level).toBe(2);
      // 40 * (80 + 82) / 100 = 40 * 162 / 100 = 64.8 -> 64
      expect(character.attack).toBe(64);
      expect(character.defence).toBe(16); // 10 * 162 / 100 = 16.2 -> 16
      expect(character.health).toBe(82);
    });

    test('Magician should level up correctly', () => {
      const character = new Magician(1);

      character.levelUp();

      expect(character.level).toBe(2);
      expect(character.attack).toBe(16); // 10 * 162 / 100 = 16.2 -> 16
      expect(character.defence).toBe(64); // 40 * 162 / 100 = 64.8 -> 64
      expect(character.health).toBe(82);
    });

    test('Vampire should level up correctly', () => {
      const character = new Vampire(1);

      character.levelUp();

      expect(character.level).toBe(2);
      expect(character.attack).toBe(40);
      expect(character.defence).toBe(40);
      expect(character.health).toBe(82);
    });

    test('Undead should level up correctly', () => {
      const character = new Undead(1);

      character.levelUp();

      expect(character.level).toBe(2);
      expect(character.attack).toBe(64);
      expect(character.defence).toBe(16);
      expect(character.health).toBe(82);
    });

    test('Daemon should level up correctly', () => {
      const character = new Daemon(1);

      character.levelUp();

      expect(character.level).toBe(2);
      expect(character.attack).toBe(16);
      expect(character.defence).toBe(16);
      expect(character.health).toBe(82);
    });
  });
});
