import React from 'react';
import { Button } from '@patternfly/react-core';
import { login } from '../../jwt/jwt';
import { PageHeaderTools } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';

const Login = () => {
  const intl = useIntl();
  return (
    <PageHeaderTools>
      <Button
        ouiaId="top-right-login-button"
        variant="tertiary"
        aria-label="Toggle primary navigation"
        widget-type="InsightsNavToggle"
        onClick={() => login()}
      >
        {intl.formatMessage(messages.login)}
      </Button>
    </PageHeaderTools>
  );
};

export default Login;
