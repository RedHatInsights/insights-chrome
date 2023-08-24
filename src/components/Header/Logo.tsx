import React, { memo } from 'react';
import logo from '../../../static/images/logo.svg';
import { Brand } from '@patternfly/react-core/dist/dynamic/components/Brand';

const Logo = () => <Brand className="chr-c-brand" src={logo} alt="Red Hat Logo" />;

export default memo(Logo);
