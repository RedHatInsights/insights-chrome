import React, { Fragment } from 'react';
import Login from './Login';
import HeaderAlert from './HeaderAlert';
import cookie from 'js-cookie';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

function Unauthed() {
  const intl = useIntl();
  return (
    <Fragment>
      <Login />
      {cookie.get('cs_loggedOut') === 'true' ? (
        <HeaderAlert variant="success" title={intl.formatMessage(messages.loggedOut)} onDismiss={() => cookie.set('cs_loggedOut', 'false')} />
      ) : null}
    </Fragment>
  );
}

export default Unauthed;
