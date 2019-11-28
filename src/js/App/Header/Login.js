import React from 'react';
import { Button } from '@patternfly/react-core';
import { login } from '../../jwt/jwt';

const Login = () => (
    <div className="pf-c-page__header-tools">
        <Button
            variant="tertiary"
            aria-label="Toggle primary navigation"
            widget-type="InsightsNavToggle"
            onClick={ login }>
          Log in
        </Button>
    </div>
);

export default Login;
