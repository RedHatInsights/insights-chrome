import React from 'react';
import PropTypes from 'prop-types';
import { NavExpandable } from '@patternfly/react-core';
import ChromeNavItemFactory from './ChromeNavItemFactory';
import { useSelector } from 'react-redux';
import { isFedRamp } from '../../../utils';
import { computeFedrampResult } from '../../../utils/useRenderFedramp';

const ChromeNavExapandable = ({ title, routes, active, isHidden, id }) => {
  const modules = useSelector((state) => state.chrome.modules);
  let filteredFedrampRoutes = routes;
  if (isFedRamp()) {
    filteredFedrampRoutes = routes.filter(({ appId, href }) => {
      return computeFedrampResult(appId, href, modules[appId]);
    });
  }

  if (isHidden || filteredFedrampRoutes.filter(({ appId }) => !!appId).length === 0) {
    return null;
  }

  const quickStartHighlightId = title.replace(/\s/g, '-');
  return (
    <NavExpandable
      id={id}
      isExpanded={active}
      isActive={active}
      className="ins-m-navigation-align"
      title={title}
      data-quickstart-id={quickStartHighlightId}
    >
      {filteredFedrampRoutes.map((item, index) => (
        <ChromeNavItemFactory key={index} {...item} />
      ))}
    </NavExpandable>
  );
};

ChromeNavExapandable.propTypes = {
  isHidden: PropTypes.bool,
  title: PropTypes.string,
  routes: PropTypes.array.isRequired,
  active: PropTypes.bool,
  id: PropTypes.string,
};

export default ChromeNavExapandable;
