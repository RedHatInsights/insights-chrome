import React, { Fragment } from 'react';
import Brand from './Brand';
import Tools from './Tools';
import UnAuthtedHeader from './UnAuthtedHeader';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import AppFilter from './AppFilter';
import { isFilterEnabled } from '../../utils/isAppNavEnabled';

const Header = ({ user }) => {
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

Header.propTypes = {
  user: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.shape({
      [PropTypes.string]: PropTypes.any,
    }),
  ]),
};

export default connect(({ chrome: { user } }) => ({ user }))(Header);
