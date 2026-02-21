/**
 * @todo
 * @param index - индекс поля
 * @param boardSize - размер квадратного поля (в длину или ширину)
 * @returns строка - тип ячейки на поле:
 *
 * top-left
 * top-right
 * top
 * bottom-left
 * bottom-right
 * bottom
 * right
 * left
 * center
 *
 * @example
 * ```js
 * calcTileType(0, 8); // 'top-left'
 * calcTileType(1, 8); // 'top'
 * calcTileType(63, 8); // 'bottom-right'
 * calcTileType(7, 7); // 'left'
 * ```
 */
export function calcTileType(index, boardSize) {
  // Проверка на верхнюю строку
  if (index < boardSize) {
    // Верхний левый угол
    if (index === 0) return 'top-left';
    // Верхний правый угол
    if (index === boardSize - 1) return 'top-right';
    // Верхняя граница
    return 'top';
  }

  // Проверка на нижнюю строку
  if (index >= boardSize * (boardSize - 1)) {
    // Нижний левый угол
    if (index === boardSize * (boardSize - 1)) return 'bottom-left';
    // Нижний правый угол
    if (index === boardSize * boardSize - 1) return 'bottom-right';
    // Нижняя граница
    return 'bottom';
  }

  // Проверка на левый столбец
  if (index % boardSize === 0) return 'left';

  // Проверка на правый столбец
  if (index % boardSize === boardSize - 1) return 'right';

  // Все остальные ячейки
  return 'center';
}

export function calcHealthLevel(health) {
  if (health < 15) {
    return 'critical';
  }

  if (health < 50) {
    return 'normal';
  }

  return 'high';
}

/**
 * Форматирует информацию о персонаже для отображения в tooltip
 * @param character объект персонажа
 * @returns строка в формате "🎖1 ⚔10 🛡40 ❤50"
 */
export function formatCharacterInfo(character) {
  const {
    level, attack, defence, health,
  } = character;
  return `🎖${level} ⚔${attack} 🛡${defence} ❤${health}`;
}

/**
 * Рассчитывает расстояние между двумя ячейками на поле
 * @param {number} fromIndex - индекс начальной ячейки
 * @param {number} toIndex - индекс целевой ячейки
 * @param {number} boardSize - размер поля (по умолчанию 8)
 * @returns {number} - расстояние по "королевской" метрике
 */
export function getDistance(fromIndex, toIndex, boardSize = 8) {
  const fromRow = Math.floor(fromIndex / boardSize);
  const fromCol = fromIndex % boardSize;
  const toRow = Math.floor(toIndex / boardSize);
  const toCol = toIndex % boardSize;

  return Math.max(Math.abs(fromRow - toRow), Math.abs(fromCol - toCol));
}

/**
 * Определяет максимальную дистанцию перемещения для типа персонажа
 * @param characterType тип персонажа
 * @returns максимальное расстояние перемещения
 */
export function getMoveRange(characterType) {
  switch (characterType) {
    case 'swordsman':
    case 'undead':
      return 4;
    case 'bowman':
    case 'vampire':
      return 2;
    case 'magician':
    case 'daemon':
      return 1;
    default:
      return 0;
  }
}

/**
 * Определяет максимальную дистанцию атаки для типа персонажа
 * @param characterType тип персонажа
 * @returns максимальное расстояние атаки
 */
export function getAttackRange(characterType) {
  switch (characterType) {
    case 'swordsman':
    case 'undead':
      return 1;
    case 'bowman':
    case 'vampire':
      return 2;
    case 'magician':
    case 'daemon':
      return 4;
    default:
      return 0;
  }
}

/**
 * Проверяет, можно ли переместиться из одной ячейки в другую
 * @param fromIndex индекс начальной ячейки
 * @param toIndex индекс целевой ячейки
 * @param characterType тип персонажа
 * @param boardSize размер поля
 * @returns true, если перемещение возможно
 */
export function canMove(fromIndex, toIndex, characterType, boardSize = 8) {
  const distance = getDistance(fromIndex, toIndex, boardSize);
  const maxMoveDistance = getMoveRange(characterType);
  return distance <= maxMoveDistance;
}

/**
 * Проверяет, можно ли атаковать из одной ячейки в другую
 * @param fromIndex индекс начальной ячейки
 * @param toIndex индекс целевой ячейки
 * @param characterType тип персонажа
 * @param boardSize размер поля
 * @returns true, если атака возможна
 */
export function canAttack(fromIndex, toIndex, characterType, boardSize = 8) {
  const distance = getDistance(fromIndex, toIndex, boardSize);
  const maxAttackDistance = getAttackRange(characterType);
  return distance <= maxAttackDistance;
}

/**
 * Рассчитывает урон от атаки
 * @param attacker объект атакующего персонажа
 * @param target объект цели атаки
 * @returns расчетный урон
 */
export function calculateDamage(attacker, target) {
  return Math.max(attacker.attack - target.defence, attacker.attack * 0.1);
}

/**
 * Проверяет, умер ли персонаж после получения урона
 * @param character объект персонажа
 * @returns true, если персонаж мертв
 */
export function isCharacterDead(character) {
  return character.health <= 0;
}

/**
 * Применяет урон к персонажу (чистая функция)
 * @param character объект персонажа
 * @param damage величина урона
 * @returns новый объект персонажа с обновленным здоровьем
 */
export function applyDamage(character, damage) {
  return {
    ...character,
    health: Math.max(0, character.health - damage),
  };
}

/**
 * Получает возможные цели для атаки из указанной позиции
 * @param fromIndex индекс атакующего
 * @param characterType тип атакующего персонажа
 * @param enemyPositions позиции врагов
 * @param boardSize размер поля
 * @returns массив индексов возможных целей
 */
export function getAttackTargets(fromIndex, characterType, enemyPositions, boardSize = 8) {
  const attackRange = getAttackRange(characterType);
  const targets = [];

  enemyPositions.forEach((enemyPos) => {
    const distance = getDistance(fromIndex, enemyPos.position, boardSize);
    if (distance <= attackRange) {
      targets.push(enemyPos.position);
    }
  });

  return targets;
}

/**
 * Получает возможные клетки для атаки (для подсветки)
 * @param fromIndex индекс атакующего
 * @param characterType тип атакующего персонажа
 * @param boardSize размер поля
 * @returns массив индексов клеток в радиусе атаки
 */
export function getAttackArea(fromIndex, characterType, boardSize = 8) {
  const attackRange = getAttackRange(characterType);
  const attackArea = [];

  const fromRow = Math.floor(fromIndex / boardSize);
  const fromCol = fromIndex % boardSize;

  for (let row = fromRow - attackRange; row <= fromRow + attackRange; row++) {
    for (let col = fromCol - attackRange; col <= fromCol + attackRange; col++) {
      if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
        const toIndex = row * boardSize + col;
        const distance = getDistance(fromIndex, toIndex, boardSize);
        if (distance <= attackRange) {
          attackArea.push(toIndex);
        }
      }
    }
  }

  return attackArea;
}
