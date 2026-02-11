import {
  calculateDamage,
  getDistance,
  getAttackRange,
  getMoveRange,
  canAttack,
  canMove,
} from './utils';

/**
 * Класс для улучшенного ИИ компьютера
 */
export class AdvancedAI {
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
      // 1. Пытаемся найти лучшую цель для атаки
      const attackAction = this.findBestAttackAction(
        enemyPos,
        playerPositions,
        boardSize,
      );

      if (attackAction) {
        actions.push(attackAction);
      } else {
        // 2. Если не можем атаковать, ищем лучший ход
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

    // 3. Выбираем лучшее действие из всех возможных
    if (actions.length === 0) {
      return null;
    }

    // Сортируем по приоритету (атака > перемещение, высокий урон > низкий урон)
    actions.sort((a, b) => {
      // Атака имеет более высокий приоритет, чем перемещение
      if (a.type === 'attack' && b.type !== 'attack') return -1;
      if (a.type !== 'attack' && b.type === 'attack') return 1;

      // Сравниваем по оценке (score)
      return b.score - a.score;
    });

    return actions[0];
  }

  /**
   * Находит лучшую цель для атаки
   */
  static findBestAttackAction(enemyPos, playerPositions, boardSize) {
    const { position, character } = enemyPos;
    let bestTarget = null;
    let bestScore = -Infinity;

    playerPositions.forEach((playerPos) => {
      if (canAttack(position, playerPos.position, character.type, boardSize)) {
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

    // 1. Приоритет слабым персонажам (низкое здоровье)
    const healthFactor = (100 - target.health) / 100;
    score += healthFactor * 50;

    // 2. Огромный бонус за возможность убить за один удар
    const potentialDamage = calculateDamage(attacker, target);
    if (potentialDamage >= target.health) {
      score += 100;
    }

    // 3. Бонус за тип персонажа (некоторые типы эффективны против других)
    const typeBonus = this.getTypeAdvantageBonus(attacker.type, target.type);
    score += typeBonus;

    // 4. Приоритет персонажам с низкой защитой
    const defenseFactor = (100 - target.defence) / 100;
    score += defenseFactor * 20;

    // 5. Приоритет персонажам с высоким уровнем
    score += target.level * 10;

    return score;
  }

  /**
   * Возвращает бонус за преимущество типа
   */
  static getTypeAdvantageBonus(attackerType, targetType) {
    const advantages = {
      swordsman: {
        undead: 30,   // Мечник эффективен против нежити
        daemon: 20,   // Мечник эффективен против демонов
      },
      bowman: {
        vampire: 30,  // Лучник эффективен против вампиров
        magician: 20, // Лучник эффективен против магов
      },
      magician: {
        daemon: 40,   // Маг очень эффективен против демонов
        undead: 20,   // Маг эффективен против нежити
        vampire: 20,  // Маг эффективен против вампиров
      },
      vampire: {
        magician: 30, // Вампир эффективен против магов
        bowman: 20,   // Вампир эффективен против лучников
      },
      undead: {
        swordsman: 30, // Нежить эффективна против мечников
        bowman: 20,    // Нежить эффективна против лучников
      },
      daemon: {
        magician: 40,  // Демон очень эффективен против магов
        bowman: 20,    // Демон эффективен против лучников
      },
    };

    return advantages[attackerType]?.[targetType] || 0;
  }

  /**
   * Находит лучший ход для персонажа
   */
  static findBestMoveAction(enemyPos, playerPositions, allEnemyPositions, boardSize) {
    // Если нет игроков, нет смысла перемещаться
    if (playerPositions.length === 0) {
      return null;
    }

    const { position, character } = enemyPos;
    const possibleMoves = this.getPossibleMoves(
      position,
      character.type,
      [...allEnemyPositions, ...playerPositions],
      boardSize,
    );

    if (possibleMoves.length === 0) {
      return null;
    }

    let bestMove = null;
    let bestScore = -Infinity;

    // Выбираем стратегию в зависимости от здоровья
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

    // Если оценка меньше или равна 0, нет смысла перемещаться
    if (bestScore <= 0) {
      return null;
    }

    return bestMove;
  }
  /**
   * Получает все возможные ходы для персонажа
   */
  static getPossibleMoves(fromIndex, characterType, occupiedPositions, boardSize) {
    const possibleMoves = [];
    const maxMove = getMoveRange(characterType);

    const fromRow = Math.floor(fromIndex / boardSize);
    const fromCol = fromIndex % boardSize;

    for (let row = fromRow - maxMove; row <= fromRow + maxMove; row++) {
      for (let col = fromCol - maxMove; col <= fromCol + maxMove; col++) {
        if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
          const newIndex = row * boardSize + col;

          // Исключаем текущую позицию персонажа
          if (newIndex === fromIndex) {
            continue;
          }

          // Проверяем, что клетка свободна и находится в пределах радиуса перемещения
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

    // 1. Бонус за возможность атаковать с новой позиции
    const attackTargets = playerPositions.filter((playerPos) =>
      canAttack(toPosition, playerPos.position, character.type, boardSize),
    );
    score += attackTargets.length * 50;

    // 2. Оценка целей в радиусе атаки
    attackTargets.forEach((target) => {
      const attackScore = this.calculateAttackScore(character, target.character);
      score += attackScore * 0.5; // Меньший вес, чем при фактической атаке
    });

    // 3. Близость к врагам (зависит от стратегии)
    playerPositions.forEach((playerPos) => {
      const currentDistance = getDistance(fromPosition, playerPos.position, boardSize);
      const newDistance = getDistance(toPosition, playerPos.position, boardSize);
      const attackRange = getAttackRange(character.type);

      if (strategy === 'aggressive') {
        // Агрессивная стратегия: приближаемся к врагам
        if (newDistance < currentDistance) {
          score += 20;
        }
        if (newDistance <= attackRange) {
          score += 30; // Бонус за попадание в радиус атаки
        }
      } else if (strategy === 'defensive') {
        // Защитная стратегия: отдаляемся от врагов
        if (newDistance > currentDistance) {
          score += 15;
        }
      } else {
        // Стратегическая: баланс
        if (newDistance <= attackRange) {
          score += 25;
        } else if (newDistance <= attackRange + 1) {
          score += 10;
        }
      }
    });

    // 4. Штраф за опасные позиции (близко к врагам, которые могут атаковать)
    const dangerScore = this.calculateDangerScore(
      toPosition,
      playerPositions,
      character,
      boardSize,
    );
    score -= dangerScore * 10;

    // 5. Бонус за позицию рядом с союзниками (для защиты)
    const allyBonus = this.calculateAllyBonus(toPosition, enemyPositions, boardSize);
    score += allyBonus;

    return score;
  }

  /**
   * Рассчитывает уровень опасности позиции
   */
  static calculateDangerScore(position, playerPositions, character, boardSize) {
    let danger = 0;

    playerPositions.forEach((playerPos) => {
      const distance = getDistance(position, playerPos.position, boardSize);
      const playerAttackRange = getAttackRange(playerPos.character.type);

      if (distance <= playerAttackRange) {
        // Чем ближе враг, тем опаснее
        const damagePotential = playerPos.character.attack / 10;
        danger += damagePotential * (playerAttackRange - distance + 1);

        // Если враг может убить нас за один удар, позиция очень опасна
        const potentialDamage = calculateDamage(playerPos.character, character);
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
      const distance = getDistance(position, enemyPos.position, boardSize);

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

    // Лучники и вампиры - случайный выбор между агрессивной и стратегической
    return Math.random() > 0.5 ? 'aggressive' : 'strategic';
  }
}
