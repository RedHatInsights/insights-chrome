import React, { useEffect, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import classNames from 'classnames';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';
import { hidePreviewBannerAtom, isPreviewAtom, previewModalOpenAtom, setPreviewSeenAtom, togglePreviewWithCheckAtom } from '../../state/atoms/releaseAtom';
import BetaInfoModal from './BetaInfoModal';
import { userConfigAtom } from '../../state/atoms/userConfigAtom';
import BetaSwitcherDropdown from './BetaSwitcherDropdown';

import './BetaSwitcher.scss';

const BetaSwitcher = () => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [hideBanner, setHideBanner] = useAtom(hidePreviewBannerAtom);
  const [isPreview, setIsPreview] = useAtom(isPreviewAtom);
  const togglePreviewWithCheck = useSetAtom(togglePreviewWithCheckAtom);
  const setUserPreviewSeen = useSetAtom(setPreviewSeenAtom);
  const [isBetaModalOpen, setIsBetaModalOpen] = useAtom(previewModalOpenAtom);
  const {
    data: { uiPreviewSeen },
  } = useAtomValue(userConfigAtom);
  useEffect(() => {
    const chromeRenderElement = document.getElementById('chrome-app-render-root');
    // adjust the height of the chrome render element to fit the banner and not show extra scrollbar
    if (!hideBanner && bannerRef.current && chromeRenderElement) {
      const { height } = bannerRef.current.getBoundingClientRect();
      chromeRenderElement.style.height = `calc(100vh - ${height}px)`;
    } else if (hideBanner && chromeRenderElement) {
      chromeRenderElement.style.removeProperty('height');
    }
    if (isPreview) {
      // preview should always reset the banner visibility
      setHideBanner(false);
    }
  }, [isPreview, hideBanner]);

  const handleBetaAccept = () => {
    setIsBetaModalOpen(false);
    setIsPreview(true);
    setUserPreviewSeen();
  };

  if (hideBanner) {
    return null;
  }

  const currentMode = isPreview ? 'Preview' : 'production';
  const changeModeContent = isPreview ? 'return to production, turn off' : 'see new pre-production features, turn on';

  return (
    <div ref={bannerRef}>
      <Split
        className={classNames('chr-c-beta-switcher pf-v6-u-p-xs', {
          active: isPreview,
        })}
      >
        <SplitItem isFilled>
          <Bullseye>
            <Switch
              ouiaId="PreviewSwitcher"
              id="preview-toggle"
              label={
                <Content className="pf-v6-u-text-color-inverse" component={ContentVariants.small}>
                  You&apos;re in Hybrid Cloud Console {currentMode} mode.{' '}
                  <div className="pf-v6-u-display-none pf-v6-u-display-inline-on-md"> To {changeModeContent} Preview mode</div>
                </Content>
              }
              aria-label="preview-toggle"
              isChecked={isPreview}
              onChange={(_e, checked) => togglePreviewWithCheck(checked)}
              isReversed
            />
          </Bullseye>
        </SplitItem>
        {!isPreview ? (
          <SplitItem>
            <BetaSwitcherDropdown />
          </SplitItem>
        ) : null}
      </Split>
      {!uiPreviewSeen ? <BetaInfoModal isOpen={isBetaModalOpen} toggleOpen={setIsBetaModalOpen} onAccept={handleBetaAccept} /> : null}
    </div>
  );
};

export default BetaSwitcher;
