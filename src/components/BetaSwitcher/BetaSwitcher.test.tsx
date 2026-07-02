jest.mock('./BetaInfoModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./BetaSwitcherDropdown', () => ({
  __esModule: true,
  default: () => null,
}));

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import BetaSwitcher from './BetaSwitcher';
import { describe, expect, it } from '@jest/globals';
import { hidePreviewBannerAtom, isPreviewAtom } from '../../state/atoms/releaseAtom';
import { userConfigAtom } from '../../state/atoms/userConfigAtom';

const renderBetaSwitcher = (route = '/', previewHidden = false) => {
  const store = createStore();
  store.set(hidePreviewBannerAtom, previewHidden);
  store.set(isPreviewAtom, false);
  store.set(userConfigAtom, { data: { uiPreviewSeen: true }, ready: true } as any);

  return render(
    <MemoryRouter initialEntries={[route]}>
      <Provider store={store}>
        <BetaSwitcher />
      </Provider>
    </MemoryRouter>
  );
};

describe('BetaSwitcher', () => {
  it('should render on non-lightwell routes', () => {
    const { container } = renderBetaSwitcher('/');
    expect(container.querySelector('.chr-c-beta-switcher')).toBeTruthy();
  });

  it('should not render on /lightwell route', () => {
    const { container } = renderBetaSwitcher('/lightwell');
    expect(container.querySelector('.chr-c-beta-switcher')).toBeFalsy();
  });

  it('should not render on /lightwell sub-routes', () => {
    const { container } = renderBetaSwitcher('/lightwell/some-page');
    expect(container.querySelector('.chr-c-beta-switcher')).toBeFalsy();
  });

  it('should render on routes that start with /light but not /lightwell', () => {
    const { container } = renderBetaSwitcher('/lighthouse');
    expect(container.querySelector('.chr-c-beta-switcher')).toBeTruthy();
  });

  it('should not render when banner is hidden', () => {
    const { container } = renderBetaSwitcher('/', true);
    expect(container.querySelector('.chr-c-beta-switcher')).toBeFalsy();
  });
});
