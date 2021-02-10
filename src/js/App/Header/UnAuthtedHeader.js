import React, { Fragment } from 'react';
import Login from './Login';
import Brand from './Brand';
import HeaderAlert from './HeaderAlert';
import cookie from 'js-cookie';

function Unauthed() {
  return (
    <Fragment>
      <Brand />
      <Login />
      {cookie.get('cs_loggedOut') === 'true' ? (
        <HeaderAlert variant="success" title={'You have successfully logged out.'} onAppear={() => cookie.set('cs_loggedOut', 'false')} />
      ) : null}
    </Fragment>
  );
}

export default Unauthed;
