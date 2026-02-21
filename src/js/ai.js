import {
  calculateDamage,
  getDistance,
} from './utils';

/**
 * Класс для улучшенного ИИ компьютера
 */
export default class AdvancedAI {
  /**
   * Выполняет ход компьютера с улучшенной логикой
   * @param enemyPositions позиции персонажей компьютера
   * @param playerPositions позиции персонажей игрока
   * @param boardSize размер поля
   * @returns объект с действием или null, если действий нет
   */
  static performComputerTurn(enemyPositions, playerPositions, boardSize = 8) {
    const actions = [];

    enemyPositions.forEach((enemyPos) => {
      const attackAction = this.findBestAttackAction(
        enemyPos,
        playerPositions,
        boardSize,
      );

      if (attackAction) {
        actions.push(attackAction);
      } else {
        const moveAction = this.findBestMoveAction(
          enemyPos,
          playerPositions,
          enemyPositions,
          boardSize,
        );

        if (moveAction) {
          actions.push(moveAction);
        }
      }
    });

    if (actions.length === 0) {
      return null;
    }

    actions.sort((a, b) => {
      if (a.type === 'attack' && b.type !== 'attack') return -1;
      if (a.type !== 'attack' && b.type === 'attack') return 1;
      return b.score - a.score;
    });

    return actions[0];
  }

  /**
   * Проверяет возможность атаки
   */
  static canAttack(fromIndex, toIndex, attacker, boardSize = 8) {
    const distance = getDistance(fromIndex, toIndex, boardSize);
    return distance <= attacker.attackRange;
  }

  /**
   * Находит лучшую цель для атаки
   */
  static findBestAttackAction(enemyPos, playerPositions, boardSize) {
    const { position, character } = enemyPos;
    let bestTarget = null;
    let bestScore = -Infinity;

    playerPositions.forEach((playerPos) => {
      if (this.canAttack(position, playerPos.position, character, boardSize)) {
        const score = this.calculateAttackScore(character, playerPos.character);

        if (score > bestScore) {
          bestScore = score;
          bestTarget = {
            type: 'attack',
            fromPosition: position,
            toPosition: playerPos.position,
            score,
            attacker: enemyPos,
            target: playerPos,
          };
        }
      }
    });

    return bestTarget;
  }

  /**
   * Рассчитывает оценку атаки
   */
  static calculateAttackScore(attacker, target) {
    let score = 0;

    // Приоритет слабым персонажам (низкое здоровье)
    const healthFactor = (100 - target.health) / 100;
    score += healthFactor * 50;

    // Огромный бонус за возможность убить за один удар
    const potentialDamage = calculateDamage(attacker, target);
    if (potentialDamage >= target.health) {
      score += 100;
    }

    // Бонус за тип персонажа
    const typeBonus = this.getTypeAdvantageBonus(attacker.type, target.type);
    score += typeBonus;

    // Приоритет персонажам с низкой защитой
    const defenseFactor = (100 - target.defence) / 100;
    score += defenseFactor * 20;

    // Приоритет персонажам с высоким уровнем
    score += target.level * 10;

    return score;
  }

  /**
   * Возвращает бонус за преимущество типа
   */
  static getTypeAdvantageBonus(attackerType, targetType) {
    const advantages = {
      swordsman: {
        undead: 30,
        daemon: 20,
      },
      bowman: {
        vampire: 30,
        magician: 20,
      },
      magician: {
        daemon: 40,
        undead: 20,
        vampire: 20,
      },
      vampire: {
        magician: 30,
        bowman: 20,
      },
      undead: {
        swordsman: 30,
        bowman: 20,
      },
      daemon: {
        magician: 40,
        bowman: 20,
      },
    };

    return advantages[attackerType]?.[targetType] || 0;
  }

  /**
   * Находит лучший ход для персонажа
   */
  static findBestMoveAction(enemyPos, playerPositions, allEnemyPositions, boardSize) {
    if (playerPositions.length === 0) {
      return null;
    }

    const { position, character } = enemyPos;
    const possibleMoves = this.getPossibleMoves(
      position,
      character,
      [...allEnemyPositions, ...playerPositions],
      boardSize,
    );

    if (possibleMoves.length === 0) {
      return null;
    }

    let bestMove = null;
    let bestScore = -Infinity;
    const healthPercentage = character.health;
    const strategy = this.selectStrategy(character, healthPercentage);

    possibleMoves.forEach((movePosition) => {
      const score = this.evaluateMovePosition(
        character,
        position,
        movePosition,
        playerPositions,
        allEnemyPositions,
        strategy,
        boardSize,
      );

      if (score > bestScore) {
        bestScore = score;
        bestMove = {
          type: 'move',
          fromPosition: position,
          toPosition: movePosition,
          score,
          character: enemyPos,
        };
      }
    });

    if (bestScore <= 0) {
      return null;
    }

    return bestMove;
  }

  /**
   * Получает все возможные ходы для персонажа
   */
  static getPossibleMoves(fromIndex, character, occupiedPositions, boardSize) {
    const possibleMoves = [];
    const maxMove = character.moveRange;
    const fromRow = Math.floor(fromIndex / boardSize);
    const fromCol = fromIndex % boardSize;

    for (let row = fromRow - maxMove; row <= fromRow + maxMove; row++) {
      for (let col = fromCol - maxMove; col <= fromCol + maxMove; col++) {
        if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
          const newIndex = row * boardSize + col;

          if (newIndex !== fromIndex) {
            const isOccupied = occupiedPositions.some(
              (pos) => pos.position === newIndex,
            );
            const distance = getDistance(fromIndex, newIndex, boardSize);

            if (!isOccupied && distance <= maxMove) {
              possibleMoves.push(newIndex);
            }
          }
        }
      }
    }

    return possibleMoves;
  }

  /**
   * Оценивает позицию для перемещения
   */
  static evaluateMovePosition(
    character,
    fromPosition,
    toPosition,
    playerPositions,
    enemyPositions,
    strategy,
    boardSize,
  ) {
    let score = 0;

    // Бонус за возможность атаковать с новой позиции
    const attackTargets = playerPositions.filter(
      (playerPos) => this.canAttack(
        toPosition,
        playerPos.position,
        character,
        boardSize,
      ),
    );
    score += attackTargets.length * 50;

    // Оценка целей в радиусе атаки
    attackTargets.forEach((target) => {
      const attackScore = this.calculateAttackScore(
        character,
        target.character,
      );
      score += attackScore * 0.5;
    });

    // Близость к врагам (зависит от стратегии)
    playerPositions.forEach((playerPos) => {
      const currentDistance = getDistance(
        fromPosition,
        playerPos.position,
        boardSize,
      );
      const newDistance = getDistance(
        toPosition,
        playerPos.position,
        boardSize,
      );
      const { attackRange } = character;

      if (strategy === 'aggressive') {
        // Агрессивная стратегия: приближаемся к врагам
        if (newDistance < currentDistance) {
          score += 20;
        }
        if (newDistance <= attackRange) {
          score += 30;
        }
      } else if (strategy === 'defensive') {
        // Защитная стратегия: отдаляемся от врагов
        if (newDistance > currentDistance) {
          score += 15;
        }
      } else if (newDistance <= attackRange) {
        // Стратегическая: баланс
        score += 25;
      } else if (newDistance <= attackRange + 1) {
        score += 10;
      }
    });

    // Штраф за опасные позиции
    const dangerScore = this.calculateDangerScore(
      toPosition,
      playerPositions,
      character,
      boardSize,
    );
    score -= dangerScore * 10;

    // Бонус за позицию рядом с союзниками
    const allyBonus = this.calculateAllyBonus(
      toPosition,
      enemyPositions,
      boardSize,
    );
    score += allyBonus;

    return score;
  }

  /**
   * Рассчитывает уровень опасности позиции
   */
  static calculateDangerScore(
    position,
    playerPositions,
    character,
    boardSize,
  ) {
    let danger = 0;

    playerPositions.forEach((playerPos) => {
      const { character: playerCharacter, position: playerPosition } = playerPos;
      const distance = getDistance(
        position,
        playerPosition,
        boardSize,
      );
      const playerAttackRange = playerCharacter.attackRange;

      if (distance <= playerAttackRange) {
        // Чем ближе враг, тем опаснее
        const damagePotential = playerCharacter.attack / 10;
        const rangeBonus = playerAttackRange - distance + 1;

        danger += damagePotential * rangeBonus;

        // Если враг может убить нас за один удар, позиция очень опасна
        const potentialDamage = calculateDamage(
          playerCharacter,
          character,
        );

        if (potentialDamage >= character.health) {
          danger += 50;
        }
      }
    });

    return danger;
  }

  /**
   * Рассчитывает бонус за близость к союзникам
   */
  static calculateAllyBonus(position, enemyPositions, boardSize) {
    let bonus = 0;

    enemyPositions.forEach((enemyPos) => {
      const distance = getDistance(
        position,
        enemyPos.position,
        boardSize,
      );

      if (distance === 1) {
        bonus += 20; // Рядом с союзником
      } else if (distance === 2) {
        bonus += 10; // Недалеко от союзника
      }
    });

    return bonus;
  }

  /**
   * Выбирает стратегию поведения
   */
  static selectStrategy(character, healthPercentage) {
    // Если здоровье низкое - защитная стратегия
    if (healthPercentage < 30) {
      return 'defensive';
    }

    // Маги и демоны используют стратегическую тактику
    if (character.type === 'magician' || character.type === 'daemon') {
      return 'strategic';
    }

    // Мечники и нежить - агрессивные
    if (character.type === 'swordsman' || character.type === 'undead') {
      return 'aggressive';
    }

    // Лучники и вампиры - случайный выбор
    return Math.random() > 0.5 ? 'aggressive' : 'strategic';
  }
}
