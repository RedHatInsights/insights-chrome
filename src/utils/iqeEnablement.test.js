import iqeEnablement from './iqeEnablement';

describe('iqeEnablement', () => {
  test('should correctly spread headers object', async () => {
    const result = iqeEnablement.spreadAdditionalHeaders({ headers: { one: 'ONE', two: 'Two' } });

    expect(result).toEqual({ one: 'ONE', two: 'Two' });
  });

  test('should correctly spread headers from array of arrays', async () => {
    const result = iqeEnablement.spreadAdditionalHeaders({
      headers: [
        ['one', 'ONE'],
        ['two', 'Two'],
      ],
    });

    expect(result).toEqual({ one: 'ONE', two: 'Two' });
  });
});
