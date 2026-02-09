import { calcTileType } from '../utils';

describe('calcTileType function', () => {
  const boardSize = 8;

  test('should return top-left for index 0', () => {
    expect(calcTileType(0, boardSize)).toBe('top-left');
  });

  test('should return top for index 1', () => {
    expect(calcTileType(1, boardSize)).toBe('top');
  });

  test('should return top-right for index 7', () => {
    expect(calcTileType(7, boardSize)).toBe('top-right');
  });

  test('should return right for index 15', () => {
    expect(calcTileType(15, boardSize)).toBe('right');
  });

  test('should return bottom-right for index 63', () => {
    expect(calcTileType(63, boardSize)).toBe('bottom-right');
  });

  test('should return bottom for index 62', () => {
    expect(calcTileType(62, boardSize)).toBe('bottom');
  });

  test('should return bottom-left for index 56', () => {
    expect(calcTileType(56, boardSize)).toBe('bottom-left');
  });

  test('should return left for index 48', () => {
    expect(calcTileType(48, boardSize)).toBe('left');
  });

  test('should return center for index 18', () => {
    expect(calcTileType(18, boardSize)).toBe('center');
  });

  // Дополнительные тесты для проверки угловых случаев
  test('should handle custom board size', () => {
    expect(calcTileType(0, 4)).toBe('top-left');
    expect(calcTileType(3, 4)).toBe('top-right');
    expect(calcTileType(12, 4)).toBe('bottom-left');
    expect(calcTileType(15, 4)).toBe('bottom-right');
    expect(calcTileType(1, 4)).toBe('top');
    expect(calcTileType(14, 4)).toBe('bottom');
    expect(calcTileType(4, 4)).toBe('left');
    expect(calcTileType(7, 4)).toBe('right');
    expect(calcTileType(5, 4)).toBe('center');
  });
});
