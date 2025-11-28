import { ensureStringArray } from './string';

describe('ensureStringArray', () => {
  test('wraps a non-empty string into an array with that string', () => {
    const input = 'hello';
    const result = ensureStringArray(input);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(['hello']);
  });

  test('wraps an empty string into an array with empty string', () => {
    const input = '';
    const result = ensureStringArray(input);
    expect(result).toEqual(['']);
  });

  test('returns the same reference when given an array with values', () => {
    const arr = ['a', 'b'];
    const result = ensureStringArray(arr);
    expect(result).toBe(arr);
    expect(result).toEqual(['a', 'b']);
  });

  test('returns the same reference when given an empty array', () => {
    const arr: string[] = [];
    const result = ensureStringArray(arr);
    expect(result).toBe(arr);
    expect(result.length).toBe(0);
  });
});
