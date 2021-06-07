import React, { memo } from 'react';
import logo from '../../../../static/images/logo.svg';

const Logo = () => <img src={logo} alt="Red Hat Logo" />;

export default memo(Logo);
