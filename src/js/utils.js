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
 * */
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
 * @param fromIndex индекс начальной ячейки
 * @param toIndex индекс целевой ячейки
 * @param boardSize размер поля
 * @returns расстояние по "королевской" метрике
 */
export function getDistance(fromIndex, toIndex, boardSize = 8) {
  const fromRow = Math.floor(fromIndex / boardSize);
  const fromCol = fromIndex % boardSize;
  const toRow = Math.floor(toIndex / boardSize);
  const toCol = toIndex % boardSize;

  // Расстояние по "королевской" метрике (максимум из разностей по строкам и столбцам)
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
