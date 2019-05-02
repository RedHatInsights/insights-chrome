import React from 'react';
import { Button } from '@patternfly/react-core/dist/esm/components/Button';
import { login } from '../../jwt/jwt';

export default () => (
    <div className="pf-c-page__header-tools">
        <Button
            variant="tertiary"
            aria-label="Toggle primary navigation"
            widget-type="InsightsNavToggle"
            onClick={ login }>
          Login
        </Button>
    </div>
);

