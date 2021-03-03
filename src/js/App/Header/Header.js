import React, { Fragment } from 'react';
import Tools from './Tools';
import UnAuthtedHeader from './UnAuthtedHeader';
import AppFilter from './AppFilter';
import ContextSwitcher from './ContextSwitcher';
import { isFilterEnabled } from '../../utils/isAppNavEnabled';
import { isContextSwitcherEnabled } from '../../utils/isAppNavEnabled';
import { useSelector } from 'react-redux';
import Logo from './Logo';

export const Header = () => {
  const user = useSelector(({ chrome }) => chrome?.user);
  return (
    <Fragment>
      <a href="./" className="ins-c-header-link">
        <Logo />
      </a>
      {user && isFilterEnabled && <AppFilter />}
      {user && isContextSwitcherEnabled && <ContextSwitcher />}
    </Fragment>
  );
};

export const HeaderTools = () => {
  const user = useSelector(({ chrome }) => chrome?.user);
  if (!user) {
    return <UnAuthtedHeader />;
  }
  return <Tools />;
};
