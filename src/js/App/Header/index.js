import React, { Fragment } from 'react';
import Brand from './Brand';
import Tools from './Tools';
import Login from './Login';

export function unauthed() {
    return <Fragment>
        <Brand />
        <Login />
    </Fragment>;
}

;

const Header = () => (
    <Fragment>
        <Brand />
        <Tools />
    </Fragment>
);

export default Header;
