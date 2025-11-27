import React, { useContext } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';
import ChromeAuthContext from '../../auth/ChromeAuthContext';

const Login = () => {
  const intl = useIntl();
  const { login } = useContext(ChromeAuthContext);
  return (
    <Button ouiaId="top-right-login-button" variant="tertiary" aria-label="Toggle primary navigation" widget-type="InsightsNavToggle" onClick={() => login()}>
      {intl.formatMessage(messages.login)}
    </Button>
  );
};

export default Login;
