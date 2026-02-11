import { AdvancedAI } from '../src/js/ai';

describe('Advanced AI Tests', () => {
  describe('calculateAttackScore', () => {
    test('should give higher score to low health targets', () => {
      const attacker = { type: 'swordsman', attack: 40, defence: 10, health: 50 };
      const weakTarget = { type: 'vampire', health: 10, defence: 25, level: 1 };
      const strongTarget = { type: 'vampire', health: 100, defence: 25, level: 1 };

      const weakScore = AdvancedAI.calculateAttackScore(attacker, weakTarget);
      const strongScore = AdvancedAI.calculateAttackScore(attacker, strongTarget);

      expect(weakScore).toBeGreaterThan(strongScore);
    });

    test('should give huge bonus for kill shot', () => {
      const attacker = { type: 'swordsman', attack: 100, defence: 10, health: 50 };
      const target = { type: 'vampire', health: 50, defence: 10, level: 1 };

      const score = AdvancedAI.calculateAttackScore(attacker, target);

      expect(score).toBeGreaterThan(100); // Должен быть большой бонус за возможность добить
    });

    test('should consider type advantages', () => {
      // Мечник силен против Нежити
      const attacker = { type: 'swordsman', attack: 40, defence: 10, health: 50 };
      const advantagedTarget = { type: 'undead', health: 50, defence: 10, level: 1 };
      const neutralTarget = { type: 'vampire', health: 50, defence: 10, level: 1 };

      const advantagedScore = AdvancedAI.calculateAttackScore(attacker, advantagedTarget);
      const neutralScore = AdvancedAI.calculateAttackScore(attacker, neutralTarget);

      expect(advantagedScore).toBeGreaterThan(neutralScore);
    });
  });

  describe('getTypeAdvantageBonus', () => {
    test('should return bonus for type advantage', () => {
      // Мечник против Нежити
      expect(AdvancedAI.getTypeAdvantageBonus('swordsman', 'undead')).toBe(30);

      // Маг против Демона
      expect(AdvancedAI.getTypeAdvantageBonus('magician', 'daemon')).toBe(40);

      // Нет преимущества
      expect(AdvancedAI.getTypeAdvantageBonus('swordsman', 'vampire')).toBe(0);
    });
  });

  describe('selectStrategy', () => {
    test('should select defensive strategy for low health', () => {
      const character = { type: 'swordsman', health: 20 };
      const strategy = AdvancedAI.selectStrategy(character, 20); // 20% здоровья

      expect(strategy).toBe('defensive');
    });

    test('should select strategic for mages and demons', () => {
      const magician = { type: 'magician', health: 80 };
      const daemon = { type: 'daemon', health: 80 };

      expect(AdvancedAI.selectStrategy(magician, 80)).toBe('strategic');
      expect(AdvancedAI.selectStrategy(daemon, 80)).toBe('strategic');
    });

    test('should select aggressive for swordsmen and undead', () => {
      const swordsman = { type: 'swordsman', health: 80 };
      const undead = { type: 'undead', health: 80 };

      expect(AdvancedAI.selectStrategy(swordsman, 80)).toBe('aggressive');
      expect(AdvancedAI.selectStrategy(undead, 80)).toBe('aggressive');
    });
  });

  describe('findBestAttackAction', () => {
    const playerPositions = [
      {
        character: { type: 'vampire', health: 30, defence: 25, level: 1 },
        position: 10,
      },
      {
        character: { type: 'undead', health: 80, defence: 10, level: 2 },
        position: 11,
      },
    ];

    test('should select target with highest score', () => {
      const enemyPos = {
        character: { type: 'swordsman', attack: 40, defence: 10, health: 50 },
        position: 9,
      };

      const result = AdvancedAI.findBestAttackAction(
        enemyPos,
        playerPositions,
        8,
      );

      expect(result).not.toBeNull();
      expect(result.target.character.type).toBe('vampire'); // Должен выбрать вампира (низкое здоровье)
      expect(result.type).toBe('attack');
    });
  });

  describe('getPossibleMoves', () => {
    test('should return valid moves for swordsman', () => {
      const fromIndex = 0;
      const characterType = 'swordsman';
      const occupiedPositions = [
        { position: 0 },
        { position: 1 },
      ];

      const moves = AdvancedAI.getPossibleMoves(
        fromIndex,
        characterType,
        occupiedPositions,
        8,
      );

      // Должен вернуть массив возможных ходов (не включая занятые клетки)
      expect(Array.isArray(moves)).toBe(true);
      expect(moves).not.toContain(0); // Начальная позиция
      expect(moves).not.toContain(1); // Занятая клетка
    });
  });
});
