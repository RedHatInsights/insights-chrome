// eslint-disable-next-line @typescript-eslint/no-require-imports
const { isVisible } = require('./consts');

describe('isVisible', () => {
  test('no apps', () => {
    expect(isVisible(undefined, 'something', true)).toBe(true);
  });

  test('app not included', () => {
    expect(isVisible([], 'something', true)).toBe(true);
  });

  test('visibility object', () => {
    expect(isVisible(['something'], 'something', { something: false })).toBe(false);
    expect(isVisible(['something'], 'something', { something: true })).toBe(true);
  });

  [true, false].map((visibility) => {
    test(`visibility - ${visibility}`, () => {
      expect(isVisible(['something'], 'something', visibility)).toBe(visibility);
    });
  });
});
