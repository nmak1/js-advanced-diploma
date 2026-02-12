import AdvancedAI from '../src/js/ai';
import Bowman from '../src/js/characters/Bowman';
import Swordsman from '../src/js/characters/Swordsman';
import Magician from '../src/js/characters/Magician';
import Vampire from '../src/js/characters/Vampire';
import Undead from '../src/js/characters/Undead';
import Daemon from '../src/js/characters/Daemon';

describe('Advanced AI Integration Tests', () => {
  describe('Real game scenarios', () => {
    test('should prioritize killing weak targets', () => {
      const enemyPositions = [
        {
          character: new Vampire(1),
          position: 10,
        },
      ];

      const playerPositions = [
        {
          character: new Bowman(1),
          position: 11,
        },
        {
          character: new Swordsman(1),
          position: 12,
        },
        {
          character: new Magician(1),
          position: 9,
        },
      ];

      const action = AdvancedAI.performComputerTurn(
        enemyPositions,
        playerPositions,
        8,
      );

      expect(action).not.toBeNull();
      expect(action.type).toBe('attack');
      expect(action.toPosition).toBe(9);
    });

    test('should use type advantages', () => {
      const enemyPositions = [
        {
          character: new Swordsman(1),
          position: 10,
        },
        {
          character: new Vampire(1),
          position: 18,
        },
      ];

      const playerPositions = [
        {
          character: new Undead(1),
          position: 11,
        },
        {
          character: new Bowman(1),
          position: 19,
        },
      ];

      const action = AdvancedAI.performComputerTurn(
        enemyPositions,
        playerPositions,
        8,
      );

      expect(action).not.toBeNull();
      expect(action.fromPosition).toBe(10);
      expect(action.toPosition).toBe(11);
    });

    test('should move strategically when cannot attack', () => {
      const enemyPositions = [
        {
          character: new Swordsman(1),
          position: 0,
        },
      ];

      const playerPositions = [
        {
          character: new Bowman(1),
          position: 30,
        },
      ];

      const action = AdvancedAI.performComputerTurn(
        enemyPositions,
        playerPositions,
        8,
      );

      expect(action).not.toBeNull();
      expect(action.type).toBe('move');
      expect(action.fromPosition).toBe(0);
      expect(action.toPosition).not.toBe(0);
    });

    test('should prefer attack over move', () => {
      const enemyPositions = [
        {
          character: new Daemon(1),
          position: 10,
        },
        {
          character: new Undead(1),
          position: 0,
        },
      ];

      const playerPositions = [
        {
          character: new Magician(1),
          position: 14,
        },
        {
          character: new Bowman(1),
          position: 50,
        },
      ];

      const action = AdvancedAI.performComputerTurn(
        enemyPositions,
        playerPositions,
        8,
      );

      expect(action).not.toBeNull();
      expect(action.type).toBe('attack');
      expect(action.fromPosition).toBe(10);
    });

    test('should use defensive strategy when low health', () => {
      const weakVampire = new Vampire(1);
      weakVampire.health = 20;

      const enemyPositions = [
        {
          character: weakVampire,
          position: 10,
        },
      ];

      const playerPositions = [
        {
          character: new Swordsman(1),
          position: 11,
        },
      ];

      const action = AdvancedAI.performComputerTurn(
        enemyPositions,
        playerPositions,
        8,
      );

      expect(action).not.toBeNull();
      if (action.type === 'move') {
        const fromDist = Math.abs(
          Math.floor(action.fromPosition / 8) - Math.floor(11 / 8),
        ) + Math.abs((action.fromPosition % 8) - (11 % 8));

        const toDist = Math.abs(
          Math.floor(action.toPosition / 8) - Math.floor(11 / 8),
        ) + Math.abs((action.toPosition % 8) - (11 % 8));

        expect(toDist).toBeGreaterThanOrEqual(fromDist);
      }
    });
  });

  describe('Edge cases', () => {
    test('should return null when no player positions', () => {
      const enemyPositions = [
        {
          character: new Vampire(1),
          position: 10,
        },
      ];

      const playerPositions = [];

      const action = AdvancedAI.performComputerTurn(
        enemyPositions,
        playerPositions,
        8,
      );

      expect(action).toBeNull();
    });

    test('should return null when no enemy positions', () => {
      const enemyPositions = [];

      const playerPositions = [
        {
          character: new Bowman(1),
          position: 10,
        },
      ];

      const action = AdvancedAI.performComputerTurn(
        enemyPositions,
        playerPositions,
        8,
      );

      expect(action).toBeNull();
    });

    test('should handle isolated character', () => {
      const enemyPositions = [
        {
          character: new Vampire(1),
          position: 10,
        },
      ];

      const playerPositions = [
        {
          character: new Bowman(1),
          position: 9,
        },
        {
          character: new Swordsman(1),
          position: 11,
        },
        {
          character: new Magician(1),
          position: 2,
        },
        {
          character: new Daemon(1),
          position: 18,
        },
      ];

      const action = AdvancedAI.performComputerTurn(
        enemyPositions,
        playerPositions,
        8,
      );

      if (action) {
        expect(['attack', 'move']).toContain(action.type);
        if (action.type === 'attack') {
          expect([9, 11, 2, 18]).toContain(action.toPosition);
        }
      }
    });

    test('should handle character that cannot move or attack', () => {
      const enemyPositions = [
        {
          character: new Swordsman(1),
          position: 0,
        },
        {
          character: new Vampire(1),
          position: 1,
        },
        {
          character: new Undead(1),
          position: 8,
        },
        {
          character: new Daemon(1),
          position: 9,
        },
      ];

      const playerPositions = [
        {
          character: new Bowman(1),
          position: 20,
        },
      ];

      const action = AdvancedAI.performComputerTurn(
        enemyPositions,
        playerPositions,
        8,
      );

      expect(action).not.toBeNull();
      if (action.type === 'attack') {
        expect(action.fromPosition).not.toBe(0);
      } else if (action.type === 'move') {
        expect(action.fromPosition).not.toBe(0);
      }
    });

    test('should handle edge case of limited movement options', () => {
      const enemyPositions = [
        {
          character: new Swordsman(1),
          position: 10,
        },
        { character: new Vampire(1), position: 9 },
        { character: new Undead(1), position: 11 },
        { character: new Daemon(1), position: 2 },
      ];

      const playerPositions = [
        {
          character: new Magician(1),
          position: 63,
        },
      ];

      const action = AdvancedAI.performComputerTurn(
        enemyPositions,
        playerPositions,
        8,
      );

      if (action) {
        expect(['attack', 'move']).toContain(action.type);
        if (action.fromPosition === 10) {
          expect(action.type).toBe('move');
        }
      }
    });
  });

  describe('Performance and behavior', () => {
    test('should complete within reasonable time', () => {
      const enemyPositions = [];
      const playerPositions = [];

      for (let i = 0; i < 10; i++) {
        enemyPositions.push({
          character: new Vampire(1),
          position: i,
        });
        playerPositions.push({
          character: new Bowman(1),
          position: 63 - i,
        });
      }

      const startTime = performance.now();
      const action = AdvancedAI.performComputerTurn(
        enemyPositions,
        playerPositions,
        8,
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);

      if (action) {
        expect(['attack', 'move']).toContain(action.type);
      }
    });

    test('should prefer kill shots', () => {
      const weakBowman = new Bowman(1);
      weakBowman.health = 5;

      const enemyPositions = [
        {
          character: new Vampire(1),
          position: 10,
        },
      ];

      const playerPositions = [
        {
          character: new Swordsman(1),
          position: 11,
        },
        {
          character: weakBowman,
          position: 9,
        },
      ];

      const action = AdvancedAI.performComputerTurn(
        enemyPositions,
        playerPositions,
        8,
      );

      expect(action).not.toBeNull();
      expect(action.type).toBe('attack');
      expect(action.toPosition).toBe(9);
    });

    test('should evaluate position safety', () => {
      const enemyPositions = [
        {
          character: new Vampire(1),
          position: 10,
        },
      ];

      const playerPositions = [
        {
          character: new Bowman(1),
          position: 13,
        },
      ];

      const action = AdvancedAI.performComputerTurn(
        enemyPositions,
        playerPositions,
        8,
      );

      expect(action).not.toBeNull();
      if (action.type === 'move') {
        const fromDist = Math.abs(
          Math.floor(action.fromPosition / 8) - Math.floor(13 / 8),
        ) + Math.abs((action.fromPosition % 8) - (13 % 8));

        const toDist = Math.abs(
          Math.floor(action.toPosition / 8) - Math.floor(13 / 8),
        ) + Math.abs((action.toPosition % 8) - (13 % 8));

        expect(toDist).toBeGreaterThanOrEqual(fromDist);
      }
    });
  });
});
