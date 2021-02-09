import React, { Fragment } from 'react';
import Brand from './Brand';
import Tools from './Tools';
import UnAuthtedHeader from './UnAuthtedHeader';
import AppFilter from './AppFilter';
import { isFilterEnabled } from '../../utils/isAppNavEnabled';
import { useSelector } from 'react-redux';

const Header = () => {
  const user = useSelector(({ chrome: { user } }) => user);
  return user ? (
    <Fragment>
      <Brand />
      {isFilterEnabled && <AppFilter />}
      <Tools />
    </Fragment>
  ) : (
    <UnAuthtedHeader />
  );
};

export default Header;
