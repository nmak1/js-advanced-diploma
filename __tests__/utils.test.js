import { calcTileType } from '../src/js/utils';

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
});
