import React from 'react';
import { NavExpandable } from '@patternfly/react-core';
import ChromeNavItemFactory from './ChromeNavItemFactory';
import { useSelector } from 'react-redux';
import { isFedRamp } from '../../utils/common';
import { computeFedrampResult } from '../../utils/useRenderFedramp';
import { ReduxState, RouteDefinition } from '../../redux/store';

export type ChromeNavExapandableProps = {
  title: string;
  routes: RouteDefinition[];
  active?: boolean;
  isHidden?: boolean;
  id?: string;
};

const ChromeNavExapandable = ({ title, routes, active, isHidden, id }: ChromeNavExapandableProps) => {
  const modules = useSelector((state: ReduxState) => state.chrome.modules);
  let filteredFedrampRoutes = routes;
  if (isFedRamp()) {
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
