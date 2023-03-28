import React from 'react';
import { NavExpandable } from '@patternfly/react-core';
import ChromeNavItemFactory from './ChromeNavItemFactory';
import { useSelector } from 'react-redux';
import { ITLess } from '../../utils/common';
import { computeFedrampResult } from '../../utils/useRenderFedramp';
import { ReduxState } from '../../redux/store';
import { ChromeNavExapandableProps } from '../../@types/types';

const ChromeNavExapandable = ({ title, routes, active, isHidden, id }: ChromeNavExapandableProps) => {
  const modules = useSelector((state: ReduxState) => state.chrome.modules);
  let filteredFedrampRoutes = routes;
  if (ITLess()) {
    filteredFedrampRoutes = routes.filter(({ appId, href }) => {
      return appId && computeFedrampResult(appId, href, modules![appId]);
    });
  }

  if (isHidden || filteredFedrampRoutes.filter(({ appId }) => !!appId).length === 0) {
    return null;
  }

  const quickStartHighlightId = title.replace(/\s/g, '-');
  return (
    <NavExpandable id={id} isExpanded={active} isActive={active} title={title} data-quickstart-id={quickStartHighlightId}>
      {filteredFedrampRoutes.map((item, index) => (
        <ChromeNavItemFactory key={index} {...item} />
      ))}
    </NavExpandable>
  );
};

export default ChromeNavExapandable;
