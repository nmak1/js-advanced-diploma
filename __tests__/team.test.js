import Team from '../src/js/Team';
import Bowman from '../src/js/characters/Bowman';

describe('Team class', () => {
  test('should create empty team', () => {
    const team = new Team();
    expect(team.size).toBe(0);
  });

  test('should create team with characters', () => {
    const characters = [new Bowman(1), new Bowman(2)];
    const team = new Team(characters);
    expect(team.size).toBe(2);
  });

  test('should add character to team', () => {
    const team = new Team();
    const bowman = new Bowman(1);

    team.add(bowman);
    expect(team.size).toBe(1);
    expect(team.characters).toContain(bowman);
  });

  test('should remove character from team', () => {
    const bowman1 = new Bowman(1);
    const bowman2 = new Bowman(2);
    const team = new Team([bowman1, bowman2]);

    team.remove(bowman1);
    expect(team.size).toBe(1);
    expect(team.characters).not.toContain(bowman1);
    expect(team.characters).toContain(bowman2);
  });

  test('should be iterable', () => {
    const characters = [new Bowman(1), new Bowman(2), new Bowman(3)];
    const team = new Team(characters);

    const iterated = [];
    for (const character of team) {
      iterated.push(character);
    }

    expect(iterated).toEqual(characters);
  });
});
