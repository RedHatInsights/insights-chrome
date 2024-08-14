import React, { useState } from 'react';
import cookie from 'js-cookie';
import HeaderAlert from './HeaderAlert';
import { useAtom } from 'jotai';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';
import { AlertActionLink, AlertVariant } from '@patternfly/react-core/dist/dynamic/components/Alert';

const PreviewAlert = () => {
  const [isPreview, togglePreview] = useAtom(isPreviewAtom);
  const [prevPreviewValue, setPrevPreviewValue] = useState(isPreview);
  const shouldRenderAlert = isPreview !== prevPreviewValue;

  function handlePreviewToggle() {
    togglePreview();
  }

  return shouldRenderAlert ? (
    <HeaderAlert
      className="chr-c-alert-preview"
      title={`Preview has been ${isPreview ? 'enabled' : 'disabled'}.`}
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
          >{`${isPreview ? 'Disable' : 'Enable'} preview`}</AlertActionLink>
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
