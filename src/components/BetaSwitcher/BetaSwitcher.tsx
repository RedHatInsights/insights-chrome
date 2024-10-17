import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import classNames from 'classnames';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';
import { Text, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import WrenchIcon from '@patternfly/react-icons/dist/dynamic/icons/wrench-icon';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';
import {
  hidePreviewBannerAtom,
  isPreviewAtom,
  previewModalOpenAtom,
  setPreviewSeenAtom,
  togglePreviewWithCheckAtom,
} from '../../state/atoms/releaseAtom';
import BetaInfoModal from './BetaInfoModal';
import { userConfigAtom } from '../../state/atoms/userConfigAtom';
import BetaSwitcherDropdown from './BetaSwitcherDropdown';

import './BetaSwitcher.scss';

const BetaPopover = ({ children, isFirstTime }: PropsWithChildren<{ isFirstTime: boolean }>) => {
  const [isVisible, setIsVisible] = React.useState(isFirstTime);
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isFirstTime) {
      setIsVisible(true);
      timeout = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
        setIsVisible(false);
      }
    };
  }, [isFirstTime]);
  return (
    <Popover
      isVisible={isVisible}
      position="bottom-end"
      shouldClose={() => setIsVisible(false)}
      headerContent="Welcome to preview"
      bodyContent={
        <span>
          Look for items with this icon&nbsp;
          <Label color="purple">
            <WrenchIcon />
          </Label>
          &nbsp;to quickly identify preview features.
        </span>
      }
    >
      <>{children}</>
    </Popover>
  );
};

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

  return (
    <div ref={bannerRef}>
      <Split
        className={classNames('chr-c-beta-switcher pf-v6-u-p-xs', {
          active: isPreview,
        })}
      >
        <SplitItem isFilled>
          <Bullseye>
            <BetaPopover isFirstTime={isPreview}>
              <Switch
                ouiaId="PreviewSwitcher"
                id="preview-toggle"
                label={
                  <Text className="pf-v6-u-color-100" component={TextVariants.small}>
                    You&apos;re in Hybrid Cloud Console Preview mode.{' '}
                    <div className="pf-v6-u-display-none pf-v6-u-display-inline-on-md"> To return to production, turn off Preview mode</div>
                  </Text>
                }
                labelOff={
                  <Text className="pf-v6-u-color-light-100" component={TextVariants.small}>
                    You&apos;re in Hybrid Cloud Console production.{' '}
                    <div className="pf-v6-u-display-none pf-v6-u-display-inline-on-md"> To see new pre-production features, turn on Preview mode</div>
                  </Text>
                }
                aria-label="preview-toggle"
                isChecked={isPreview}
                onChange={(_e, checked) => togglePreviewWithCheck(checked)}
                isReversed
              />
            </BetaPopover>
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
