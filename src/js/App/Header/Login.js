import React from 'react';
import { Button } from '@patternfly/react-core';
import { login } from '../../jwt/jwt';
import { PageHeaderTools } from '@patternfly/react-core';

const Login = () => (
  <PageHeaderTools>
    <Button variant="tertiary" aria-label="Toggle primary navigation" widget-type="InsightsNavToggle" onClick={login}>
      Log in
    </Button>
  </PageHeaderTools>
);

export default Login;
