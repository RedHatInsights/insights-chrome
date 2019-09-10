import React, { Fragment } from 'react';
import Brand from './Brand';
import Tools from './Tools';
import Login from './Login';
import Beta from './Beta';

export function unauthed() {
    return <Fragment>
        <Beta />
        <Brand />
        <Login />
    </Fragment>;
}

;

const Header = () => (
    <Fragment>
        <Beta />
        <Brand />
        <Tools />
    </Fragment>
);

export default Header;
