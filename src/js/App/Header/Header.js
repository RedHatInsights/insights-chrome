import React, { Fragment } from 'react';
import Brand from './Brand';
import Tools from './Tools';
import UnAuthtedHeader from './UnAuthtedHeader';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import AppFilter from './AppFilter';
import { isFilterEnabled } from '../../utils/isAppNavEnabled';
import HeaderAlert from './HeaderAlert';
import cookie from 'js-cookie';

const Header = ({ user }) => {
  return user ? (
    <Fragment>
      <Brand />
      {user && isFilterEnabled && <AppFilter />}
      <Tools />
      {cookie.get('cs_toggledRelease') === 'true' ? (
        <HeaderAlert
          title={`You are now using the ${window.insights.chrome.isBeta() ? 'beta' : 'stable'} release.`}
          onAppear={() => cookie.set('cs_toggledRelease', 'false')}
        />
      ) : null}
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
