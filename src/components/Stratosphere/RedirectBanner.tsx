import React from 'react';
import { Alert, AlertActionCloseButton, Text, TextContent } from '@patternfly/react-core';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReduxState } from '../../redux/store';
import useMarketplacePartner from '../../hooks/useMarketplacePartner';

const RedirectBanner = () => {
  const { pathname, hash, state } = useLocation();
  const { partnerId, partner, removePartnerParam } = useMarketplacePartner();
  const navigate = useNavigate();
  const product = useSelector<ReduxState, string | undefined>((state) => state.chrome.activeProduct);

  const handleClose = () => {
    // remove only the flag search param
    const clearedParams = removePartnerParam();
    // only change the search params
    navigate(
      {
        pathname,
        search: clearedParams.toString(),
        hash,
      },
      {
        state,
        replace: true,
      }
    );
  };
  // show the banner only if correct search param exists
  return partnerId ? (
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
