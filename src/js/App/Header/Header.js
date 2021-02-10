import React, { Fragment } from 'react';
import Tools from './Tools';
import UnAuthtedHeader from './UnAuthtedHeader';
import AppFilter from './AppFilter';
import { isFilterEnabled } from '../../utils/isAppNavEnabled';
import { useSelector } from 'react-redux';
import Logo from './Logo';
import HeaderAlert from './HeaderAlert';
import cookie from 'js-cookie';

export const Header = () => {
  const user = useSelector(({ chrome }) => chrome?.user);
  return (
    <Fragment>
      <a href="./" className="ins-c-header-link">
        <Logo />
      </a>
      {user && isFilterEnabled && <AppFilter />}
      {cookie.get('cs_toggledRelease') === 'true' ? (
        <HeaderAlert
          title={`You are now using the ${window.insights.chrome.isBeta() ? 'beta' : 'stable'} release.`}
          onAppear={() => cookie.set('cs_toggledRelease', 'false')}
        />
      ) : null}
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
