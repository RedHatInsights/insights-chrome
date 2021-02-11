import React, { Fragment } from 'react';
import Login from './Login';
import LogoutAlert from './LogoutAlert';

function Unauthed() {
  return (
    <Fragment>
      <Login />
      <LogoutAlert />
    </Fragment>
  );
}

export default Unauthed;
