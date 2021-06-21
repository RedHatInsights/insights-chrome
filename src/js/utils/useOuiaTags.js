import { useEffect, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { isAnsible } from '../utils';

const useOuiaTags = () => {
  const [state, setState] = useState({
    'data-ouia-safe': 'true',
  });
  const { pathname } = useLocation();
  const { pageAction, pageObjectId, activeApp } = useSelector(
    ({ chrome: { pageAction, pageObjectId, activeApp } }) => ({ pageAction, pageObjectId, activeApp }),
    shallowEqual
  );
  useEffect(() => {
    setState(() => {
      const result = {
        'data-ouia-safe': 'true',
      };
      const sections = pathname.split('/');
      if (pathname === '/') {
        result.landing = 'true';
      }

      result['data-ouia-bundle'] = sections[1];
      result['data-ouia-app-id'] = sections[2 + isAnsible(sections)];
      result['data-ouia-subnav'] = activeApp;
      if (pageObjectId) {
        result['data-ouia-page-object-id'] = pageObjectId;
      }
      if (pageAction) {
        result['data-ouia-page-type'] = pageAction;
      }
      return result;
    });
  }, [pathname, pageAction, pageObjectId, activeApp]);

  return state;
};

export default useOuiaTags;
