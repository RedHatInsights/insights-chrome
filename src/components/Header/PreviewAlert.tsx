import React, { useState } from 'react';
import cookie from 'js-cookie';
import HeaderAlert from './HeaderAlert';
import { useAtom } from 'jotai';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';
import { isBeta } from '../../utils/common';
import { AlertActionLink, AlertVariant } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { useLocation } from 'react-router-dom';
import { useFlag } from '@unleash/proxy-client-react';

const LOCAL_PREVIEW = localStorage.getItem('chrome:local-preview') === 'true';

const PreviewAlert = ({ switchRelease }: { switchRelease: (isBeta: boolean, pathname: string, previewEnabled: boolean) => void }) => {
  const [isPreview, togglePreview] = useAtom(isPreviewAtom);
  const [prevPreviewValue, setPrevPreviewValue] = useState(isPreview);
  const location = useLocation();
  const previewEnabled = useFlag('platform.chrome.preview');

  // FIXME: Remove the cookie check once the local preview is enabled by default
  const shouldRenderAlert = LOCAL_PREVIEW ? isPreview !== prevPreviewValue : cookie.get('cs_toggledRelease') === 'true';
  const isPreviewEnabled = LOCAL_PREVIEW ? isPreview : isBeta();

  function handlePreviewToggle() {
    if (!LOCAL_PREVIEW) {
      switchRelease(isPreviewEnabled, location.pathname, previewEnabled);
    }
    togglePreview();
  }

  return shouldRenderAlert ? (
    <HeaderAlert
      className="chr-c-alert-preview"
      title={`Preview has been ${isPreviewEnabled ? 'enabled' : 'disabled'}.`}
      variant={AlertVariant.info}
      actionLinks={
        <React.Fragment>
          <AlertActionLink
            component="a"
            href="https://access.redhat.com/support/policy/updates/hybridcloud-console/lifecycle"
            target="_blank"
            rel="noreferrer"
            title="Learn more link"
          >
            Learn more
          </AlertActionLink>
          <AlertActionLink
            onClick={() => {
              handlePreviewToggle();
            }}
          >{`${isPreviewEnabled ? 'Disable' : 'Enable'} preview`}</AlertActionLink>
        </React.Fragment>
      }
      onDismiss={() => {
        cookie.set('cs_toggledRelease', 'false');
        setPrevPreviewValue(isPreview);
      }}
    />
  ) : null;
};

export default PreviewAlert;
