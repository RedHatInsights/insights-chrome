import React, { Fragment } from 'react';
import Brand from './Brand';
import Tools from './Tools';
import Login from './Login';
import LogoutAlert from './LogoutAlert';

export function unauthed() {
    return <Fragment>
        <Brand />
        <Login />
        <LogoutAlert/>
    </Fragment>;
}

const Header = () => (
    <Fragment>
        <Brand />
        <Tools />
    </Fragment>
);

export default Header;
