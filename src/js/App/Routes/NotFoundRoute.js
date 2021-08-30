import React from 'react';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core';
import { InvalidObject } from '@redhat-cloud-services/frontend-components/InvalidObject';

const NotFoundRoute = () => (
  <EmptyState id="not-found">
    <EmptyStateBody>
      <InvalidObject />
    </EmptyStateBody>
  </EmptyState>
);
export default NotFoundRoute;
