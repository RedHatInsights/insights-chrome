import React, { Fragment } from 'react';
import Logo from '../Header/Logo';
import Footer from './Footer';

export default () => (
    <Fragment>
        <Logo />
        <p className="copyright">Copyright © 2018 Red Hat, Inc.</p>
        <Footer />
    </Fragment>
)
