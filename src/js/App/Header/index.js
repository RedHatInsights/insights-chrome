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
// eslint-disable-next-line
export default () => (
    <Fragment>
        <Brand />
        <Tools />
    </Fragment>
);
