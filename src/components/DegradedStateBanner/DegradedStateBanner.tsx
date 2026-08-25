import React from 'react';
import { Banner } from '@patternfly/react-core/dist/dynamic/components/Banner';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/dynamic/icons/exclamation-triangle-icon';
import { useAtomValue } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import { useIntl } from 'react-intl';
import { degradedStateAtom, isAnyServiceDegradedAtom } from '../../state/atoms/degradedStateAtom';
import messages from '../../locales/Messages';

const DegradedStateBanner = () => {
  const intl = useIntl();
  const isDegraded = useAtomValue(isAnyServiceDegradedAtom);
  const bannerEnabled = useFlag('platform.chrome.degraded-state-banner');
  const serviceHealth = useAtomValue(degradedStateAtom);

  if (!isDegraded || !bannerEnabled) {
    return null;
  }

  const serviceNameMap = {
    userPersonalization: messages.degradedServiceUserPersonalization,
    entitlements: messages.degradedServiceEntitlements,
    configFromCache: messages.degradedServiceConfigFromCache,
    featureFlags: messages.degradedServiceFeatureFlags,
  };

  const degradedServices: string[] = [];
  if (serviceHealth.userPersonalization) degradedServices.push(intl.formatMessage(serviceNameMap.userPersonalization));
  if (serviceHealth.entitlements) degradedServices.push(intl.formatMessage(serviceNameMap.entitlements));
  if (serviceHealth.configFromCache) degradedServices.push(intl.formatMessage(serviceNameMap.configFromCache));
  if (serviceHealth.featureFlags) degradedServices.push(intl.formatMessage(serviceNameMap.featureFlags));

  const serviceList = degradedServices.join(', ');
  const prefix = intl.formatMessage(messages.degradedStateBannerPrefix);
  const suffix = intl.formatMessage(messages.degradedStateBannerSuffix);
  const screenReaderText = `${prefix} ${serviceList}. ${suffix}`;

  return (
    <Banner status="warning" screenReaderText={screenReaderText} data-ouia-component-id="DegradedStateBanner">
      <div className="pf-v6-u-text-align-center">
        <ExclamationTriangleIcon /> {prefix} <strong>{serviceList}</strong>. {suffix}
      </div>
    </Banner>
  );
};

export default DegradedStateBanner;
