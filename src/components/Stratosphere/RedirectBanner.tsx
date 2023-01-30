import React from 'react';
import { Alert, AlertActionCloseButton, Text, TextContent } from '@patternfly/react-core';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReduxState } from '../../redux/store';

// TODO: Figure out what param chrome should expect
export const AWS_BANNER_NAME = 'from-aws';
export const AZURE_BANNER_NAME = 'from-azure';

const RedirectBanner = () => {
  const { pathname, search, hash, state } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const partner = params.has(AWS_BANNER_NAME) ? 'AWS' : params.has(AZURE_BANNER_NAME) ? 'Microsoft Azure' : null;
  const product = useSelector<ReduxState, string | undefined>((state) => state.chrome.activeProduct);

  const handleClose = () => {
    // remove only the flag search param
    params.delete(AWS_BANNER_NAME);
    params.delete(AZURE_BANNER_NAME);
    // only change the search params
    navigate(
      {
        pathname,
        search: params.toString(),
        hash,
      },
      {
        state,
        replace: true,
      }
    );
  };
  // show the banner only if correct search param exists
  return params.has(AWS_BANNER_NAME) || params.has(AZURE_BANNER_NAME) ? (
    <Alert
      actionClose={<AlertActionCloseButton data-testid="stratosphere-banner-close" onClose={handleClose} />}
      isInline
      variant="success"
      title={`Congratulations, your Red Hat and ${partner} accounts are linked`}
    >
      <TextContent>
        <Text>
          Welcome to the Red Hat Hybrid Cloud Console. If you cannot access production tools for a subscription that you have purchased, please wait 5
          minutes and and confirm your subscription at subscription inventory. {product ? `Here you can configure or manage ${product}` : ''}.
        </Text>
        <a href="#">View subscription inventory</a>
      </TextContent>
    </Alert>
  ) : null;
};
export default RedirectBanner;
