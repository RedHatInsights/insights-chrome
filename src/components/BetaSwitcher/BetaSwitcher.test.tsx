jest.mock('./BetaInfoModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./BetaSwitcherDropdown', () => ({
  __esModule: true,
  default: () => null,
}));

import { render } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import BetaSwitcher from './BetaSwitcher';
import { describe, expect, it } from '@jest/globals';
import { hidePreviewBannerAtom, isPreviewAtom, layoutBannerHiddenAtom } from '../../state/atoms/releaseAtom';
import { userConfigAtom } from '../../state/atoms/userConfigAtom';

const renderBetaSwitcher = (previewHidden = false, layoutHidden = false) => {
  const store = createStore();
  store.set(hidePreviewBannerAtom, previewHidden);
  store.set(isPreviewAtom, false);
  store.set(layoutBannerHiddenAtom, layoutHidden);
  store.set(userConfigAtom, { data: { uiPreviewSeen: true }, ready: true } as any);

  return render(
    <Provider store={store}>
      <BetaSwitcher />
    </Provider>
  );
};

describe('BetaSwitcher', () => {
  it('should render when no hide flags are set', () => {
    const { container } = renderBetaSwitcher();
    expect(container.querySelector('.chr-c-beta-switcher')).toBeTruthy();
  });

  it('should not render when layoutBannerHiddenAtom is true', () => {
    const { container } = renderBetaSwitcher(false, true);
    expect(container.querySelector('.chr-c-beta-switcher')).toBeFalsy();
  });

  it('should not render when banner is hidden by user', () => {
    const { container } = renderBetaSwitcher(true);
    expect(container.querySelector('.chr-c-beta-switcher')).toBeFalsy();
  });
});
