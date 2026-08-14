import React from 'react';
import { Banner } from '@patternfly/react-core/dist/dynamic/components/Banner';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/dynamic/icons/exclamation-triangle-icon';
import { useAtomValue } from 'jotai';
import { degradedStateAtom, isAnyServiceDegradedAtom } from '../../state/atoms/degradedStateAtom';

const DegradedStateBanner: React.FC = () => {
  const isDegraded = useAtomValue(isAnyServiceDegradedAtom);
  const serviceHealth = useAtomValue(degradedStateAtom);

  if (!isDegraded) {
    return null;
  }

  const degradedServices: string[] = [];
  if (serviceHealth.userPersonalization) degradedServices.push('User Preferences');
  if (serviceHealth.entitlements) degradedServices.push('Entitlements');
  if (serviceHealth.configFromCache) degradedServices.push('Navigation Configuration');
  if (serviceHealth.featureFlags) degradedServices.push('Feature Flags');

  const message = `Some services are currently limited: ${degradedServices.join(', ')}. Core functionality is available.`;

  return (
    <Banner status="warning" screenReaderText="Warning banner">
      <div style={{ textAlign: 'center' }}>
        <ExclamationTriangleIcon /> {message}
      </div>
    </Banner>
  );
};

export default DegradedStateBanner;
