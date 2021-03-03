import React, { Fragment } from 'react';
import Tools from './Tools';
import UnAuthtedHeader from './UnAuthtedHeader';
import AppFilter from './AppFilter';
import Feedback from '../Feedback';

import { isFilterEnabled } from '../../utils/isAppNavEnabled';
import { useSelector } from 'react-redux';
import Logo from './Logo';

const isFeedbackEnabled = localStorage.getItem('chrome:experimental:feedback') === 'true' || insights.chrome.getBundle() === 'insights';

export const Header = () => {
  const user = useSelector(({ chrome }) => chrome?.user);
  return (
    <Fragment>
      <a href="./" className="ins-c-header-link">
        <Logo />
      </a>
      {user && isFilterEnabled && <AppFilter />}
      {isFeedbackEnabled && <Feedback user={user} />}
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
