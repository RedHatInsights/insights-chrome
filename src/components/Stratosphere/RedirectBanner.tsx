import React from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import useMarketplacePartner from '../../hooks/useMarketplacePartner';
import { activeProductAtom } from '../../state/atoms/activeProductAtom';

const RedirectBanner = () => {
  const { pathname, hash, state } = useLocation();
  const { partnerId, partner, removePartnerParam } = useMarketplacePartner();
  const navigate = useNavigate();
  const product = useAtomValue(activeProductAtom);

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
        {partnerId === 'from-azure' ? (
          <Text>
            It may take up to two days for all subscription information between Red Hat and Microsoft to synchronize. If any subscription services are
            needed in the meantime, like technical support, simply note this in your request to receive the full benefit of your new subscription.
          </Text>
        ) : (
          <Text>
            Welcome to the Red Hat Hybrid Cloud Console. If you cannot access production tools for a subscription that you have purchased, please wait
            5 minutes and and confirm your subscription at subscription inventory. {product ? `Here you can configure or manage ${product}.` : ''}
          </Text>
        )}
        <a href="#">View subscription inventory</a>
      </TextContent>
    </Alert>
  ) : null;
};
export default RedirectBanner;
