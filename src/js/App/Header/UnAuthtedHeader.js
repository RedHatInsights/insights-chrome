import React, { Fragment } from 'react';
import Login from './Login';
import LogoutAlert from './LogoutAlert';
import Brand from './Brand';

function Unauthed() {
  return (
    <Fragment>
      <Brand />
      <Login />
      <LogoutAlert />
    </Fragment>
  );
}

export default Unauthed;
