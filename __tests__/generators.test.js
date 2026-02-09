import { characterGenerator, generateTeam } from '../src/js/generators';
import Bowman from '../src/js/characters/Bowman';
import Swordsman from '../src/js/characters/Swordsman';
import Magician from '../src/js/characters/Magician';
import Team from '../src/js/Team';

describe('characterGenerator', () => {
  test('should generate infinite stream of characters', () => {
    const allowedTypes = [Bowman, Swordsman, Magician];
    const maxLevel = 2;
    const generator = characterGenerator(allowedTypes, maxLevel);

    const characters = new Set();

    // Генерируем 100 персонажей
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
      const character = generator.next().value;
      characters.add(character);

      // Проверяем, что персонаж правильного типа
      expect(allowedTypes.some((Type) => character instanceof Type)).toBe(true);

      // Проверяем уровень
      expect(character.level).toBeGreaterThanOrEqual(1);
      expect(character.level).toBeLessThanOrEqual(maxLevel);
    }

    // Убеждаемся, что генерируются разные персонажи
    expect(characters.size).toBeGreaterThan(1);
  });
});

describe('generateTeam', () => {
  test('should generate team with specified number of characters', () => {
    const allowedTypes = [Bowman, Swordsman, Magician];
    const maxLevel = 3;
    const characterCount = 5;

    const team = generateTeam(allowedTypes, maxLevel, characterCount);

    expect(team).toBeInstanceOf(Team);
    expect(team.size).toBe(characterCount);

    // Проверяем каждого персонажа в команде
    Array.from(team).forEach((character) => {
      expect(allowedTypes.some((Type) => character instanceof Type)).toBe(true);
      expect(character.level).toBeGreaterThanOrEqual(1);
      expect(character.level).toBeLessThanOrEqual(maxLevel);
    });
  });

  test('should generate team with correct level distribution', () => {
    const allowedTypes = [Bowman];
    const maxLevel = 4;
    const characterCount = 100;

    const team = generateTeam(allowedTypes, maxLevel, characterCount);

    const levels = Array.from(team).map((char) => char.level);

    // Проверяем, что есть персонажи разных уровней
    const uniqueLevels = [...new Set(levels)];
    expect(uniqueLevels.length).toBeGreaterThan(1);

    // Проверяем, что все уровни в допустимом диапазоне
    levels.forEach((level) => {
      expect(level).toBeGreaterThanOrEqual(1);
      expect(level).toBeLessThanOrEqual(maxLevel);
    });
  });
});
