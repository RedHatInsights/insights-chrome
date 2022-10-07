import React from 'react';
import { Bullseye, Button, EmptyState, EmptyStateBody, EmptyStateIcon, Title } from '@patternfly/react-core';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import { logoutAllTabs } from '../../jwt/jwt';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';

const IDPError = () => {
  const intl = useIntl();

  return (
    <Bullseye>
      <EmptyState>
        <EmptyStateIcon color="var(--pf-global--danger-color--100)" icon={ExclamationCircleIcon} />
        <Title headingLevel="h1" size="lg">
          {intl.formatMessage(messages.authFailure)}
        </Title>
        <EmptyStateBody>{intl.formatMessage(messages.accessRestricted)}</EmptyStateBody>
        <Button
          onClick={() => {
            logoutAllTabs(true);
          }}
          variant="primary"
        >
          {intl.formatMessage(messages.tryUsingDifferentAccount)}
        </Button>
      </EmptyState>
    </Bullseye>
  );
};

export default IDPError;
