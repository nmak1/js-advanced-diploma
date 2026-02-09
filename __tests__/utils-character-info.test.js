import { formatCharacterInfo } from '../src/js/utils';

describe('formatCharacterInfo function', () => {
  test('should format character info correctly', () => {
    const character = {
      level: 1,
      attack: 10,
      defence: 20,
      health: 50,
    };

    const result = formatCharacterInfo(character);
    expect(result).toBe('🎖1 ⚔10 🛡20 ❤50');
  });

  test('should handle different values', () => {
    const character = {
      level: 3,
      attack: 40,
      defence: 30,
      health: 75,
    };

    const result = formatCharacterInfo(character);
    expect(result).toBe('🎖3 ⚔40 🛡30 ❤75');
  });

  test('should handle level 4 max', () => {
    const character = {
      level: 4,
      attack: 50,
      defence: 50,
      health: 100,
    };

    const result = formatCharacterInfo(character);
    expect(result).toBe('🎖4 ⚔50 🛡50 ❤100');
  });

  test('should work with bowman stats', () => {
    const character = {
      level: 2,
      attack: 25,
      defence: 25,
      health: 50,
    };

    const result = formatCharacterInfo(character);
    expect(result).toBe('🎖2 ⚔25 🛡25 ❤50');
  });

  test('should work with swordsman stats', () => {
    const character = {
      level: 1,
      attack: 40,
      defence: 10,
      health: 50,
    };

    const result = formatCharacterInfo(character);
    expect(result).toBe('🎖1 ⚔40 🛡10 ❤50');
  });
});
