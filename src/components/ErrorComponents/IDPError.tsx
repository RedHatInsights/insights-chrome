import React, { useContext } from 'react';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState, EmptyStateBody, EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/exclamation-circle-icon';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';
import ChromeAuthContext from '../../auth/ChromeAuthContext';

const IDPError = () => {
  const intl = useIntl();
  const { logoutAllTabs } = useContext(ChromeAuthContext);

  return (
    <Bullseye>
      <EmptyState>
        <EmptyStateIcon color="var(--pf-v5-global--danger-color--100)" icon={ExclamationCircleIcon} />
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
