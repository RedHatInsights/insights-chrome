import React, { Fragment } from 'react';
import { AlertVariant } from '@patternfly/react-core';
import Login from './Login';
import HeaderAlert from './HeaderAlert';
import cookie from 'js-cookie';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';

function Unauthed() {
  const intl = useIntl();
  return (
    <Fragment>
      <Login />
      {cookie.get('cs_loggedOut') === 'true' ? (
        <HeaderAlert
          variant={AlertVariant.success}
          title={intl.formatMessage(messages.loggedOut)}
          onDismiss={() => cookie.set('cs_loggedOut', 'false')}
        />
      ) : null}
    </Fragment>
  );
}

export default Unauthed;
