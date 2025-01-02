import { toggleGlobalFilter } from './actions';

describe('toggleGlobalFilter', () => {
  it('should return correct action with isHidden = true', () => {
    expect(toggleGlobalFilter()).toEqual({
      type: '@@chrome/global-filter-toggle',
      payload: {
        isHidden: true,
      },
    });
  });

  it('should return correct action with isHidden = false', () => {
    expect(toggleGlobalFilter(false)).toEqual({
      type: '@@chrome/global-filter-toggle',
      payload: {
        isHidden: false,
      },
    });
  });
});
