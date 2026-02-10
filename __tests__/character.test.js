import Character from '../src/js/Character';
import Bowman from '../src/js/characters/Bowman';
import Swordsman from '../src/js/characters/Swordsman';
import Magician from '../src/js/characters/Magician';
import Vampire from '../src/js/characters/Vampire';
import Undead from '../src/js/characters/Undead';
import Daemon from '../src/js/characters/Daemon';

describe('Character class', () => {
  test('should throw error when creating Character directly', () => {
    expect(() => new Character(1)).toThrow('Cannot create instance of Character class directly');
  });

  test('should allow creating inherited classes', () => {
    expect(() => new Bowman(1)).not.toThrow();
    expect(() => new Swordsman(1)).not.toThrow();
    expect(() => new Magician(1)).not.toThrow();
    expect(() => new Vampire(1)).not.toThrow();
    expect(() => new Undead(1)).not.toThrow();
    expect(() => new Daemon(1)).not.toThrow();
  });
});

describe('Character classes level 1', () => {
  test('Bowman should have correct stats', () => {
    const bowman = new Bowman(1);
    expect(bowman.level).toBe(1);
    expect(bowman.type).toBe('bowman');
    expect(bowman.attack).toBe(25);
    expect(bowman.defence).toBe(25);
    expect(bowman.health).toBe(50);
  });

  test('Swordsman should have correct stats', () => {
    const swordsman = new Swordsman(1);
    expect(swordsman.level).toBe(1);
    expect(swordsman.type).toBe('swordsman');
    expect(swordsman.attack).toBe(40);
    expect(swordsman.defence).toBe(10);
    expect(swordsman.health).toBe(50);
  });

  test('Magician should have correct stats', () => {
    const magician = new Magician(1);
    expect(magician.level).toBe(1);
    expect(magician.type).toBe('magician');
    expect(magician.attack).toBe(10);
    expect(magician.defence).toBe(40);
    expect(magician.health).toBe(50);
  });

  test('Vampire should have correct stats', () => {
    const vampire = new Vampire(1);
    expect(vampire.level).toBe(1);
    expect(vampire.type).toBe('vampire');
    expect(vampire.attack).toBe(25);
    expect(vampire.defence).toBe(25);
    expect(vampire.health).toBe(50);
  });

  test('Undead should have correct stats', () => {
    const undead = new Undead(1);
    expect(undead.level).toBe(1);
    expect(undead.type).toBe('undead');
    expect(undead.attack).toBe(40);
    expect(undead.defence).toBe(10);
    expect(undead.health).toBe(50);
  });

  test('Daemon should have correct stats', () => {
    const daemon = new Daemon(1);
    expect(daemon.level).toBe(1);
    expect(daemon.type).toBe('daemon');
    expect(daemon.attack).toBe(10);
    expect(daemon.defence).toBe(10);
    expect(daemon.health).toBe(50);
  });
});

describe('Character classes with different levels', () => {
  test('should create character with level 3', () => {
    const swordsman = new Swordsman(3);
    expect(swordsman.level).toBe(3);
  });

  test('should create character with level 4', () => {
    const bowman = new Bowman(4);
    expect(bowman.level).toBe(4);
  });
});
