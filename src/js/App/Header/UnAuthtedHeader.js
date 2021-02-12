import React, { Fragment } from 'react';
import Login from './Login';
import HeaderAlert from './HeaderAlert';
import cookie from 'js-cookie';

function Unauthed() {
  return (
    <Fragment>
      <Login />
      {cookie.get('cs_loggedOut') === 'true' ? (
        <HeaderAlert variant="success" title={'You have successfully logged out.'} onDismiss={() => cookie.set('cs_loggedOut', 'false')} />
      ) : null}
    </Fragment>
  );
}

export default Unauthed;
