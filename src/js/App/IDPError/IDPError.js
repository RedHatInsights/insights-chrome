import React from 'react';
import { Bullseye, Button, EmptyState, EmptyStateBody, EmptyStateIcon, Title } from '@patternfly/react-core';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import { logoutAllTabs } from '../../jwt/jwt';

const IDPError = () => (
  <Bullseye>
    <EmptyState>
      <EmptyStateIcon color="var(--pf-global--danger-color--100)" icon={ExclamationCircleIcon} />
      <Title headingLevel="h1" size="lg">
        Authorization failure
      </Title>
      <EmptyStateBody>Access to this page is reserved for third party IDP token from users on authorized accounts.</EmptyStateBody>
      <Button
        onClick={() => {
          logoutAllTabs(true);
        }}
        variant="primary"
      >
        Try using different account
      </Button>
    </EmptyState>
  </Bullseye>
);

export default IDPError;
