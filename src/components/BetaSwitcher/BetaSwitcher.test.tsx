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
import { setServiceDegradedAtom } from '../../state/atoms/degradedStateAtom';

const renderBetaSwitcher = (previewHidden = false, layoutHidden = false, userPersonalizationDegraded = false) => {
  const store = createStore();
  store.set(hidePreviewBannerAtom, previewHidden);
  store.set(isPreviewAtom, false);
  store.set(layoutBannerHiddenAtom, layoutHidden);
  store.set(userConfigAtom, { data: { uiPreviewSeen: true }, ready: true } as any);
  store.set(setServiceDegradedAtom, { service: 'userPersonalization', degraded: userPersonalizationDegraded });

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

  it('should enable the preview toggle when personalization is healthy', () => {
    const { container } = renderBetaSwitcher();
    expect(container.querySelector<HTMLInputElement>('#preview-toggle')?.disabled).toBe(false);
  });

  it('should disable the preview toggle when personalization is degraded', () => {
    const { container } = renderBetaSwitcher(false, false, true);
    expect(container.querySelector<HTMLInputElement>('#preview-toggle')?.disabled).toBe(true);
  });

  it('does not mutate the render-root height (layout is handled by the .chr-c-shell flex column)', () => {
    // Regression guard: the old implementation imperatively set an inline
    // `height: calc(100vh - <bannerHeight>px)` on #chrome-app-render-root. The flex shell now owns
    // the sizing, so the banner must leave the render-root's inline height untouched.
    const renderRoot = document.createElement('div');
    renderRoot.id = 'chrome-app-render-root';
    document.body.appendChild(renderRoot);

    try {
      renderBetaSwitcher();
      expect(renderRoot.style.height).toBe('');
    } finally {
      renderRoot.remove();
    }
  });
});
