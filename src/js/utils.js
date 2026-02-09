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
