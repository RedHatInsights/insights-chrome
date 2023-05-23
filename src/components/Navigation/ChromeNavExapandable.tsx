import React from 'react';
import { NavExpandable } from '@patternfly/react-core';
import ChromeNavItemFactory from './ChromeNavItemFactory';
import { ChromeNavExapandableProps } from '../../@types/types';

const ChromeNavExapandable = ({ title, routes, active, isHidden, id }: ChromeNavExapandableProps) => {
  if (isHidden || routes.filter(({ appId, expandable }) => expandable || !!appId).length === 0) {
    return null;
  }

  const quickStartHighlightId = title.replace(/\s/g, '-');
  return (
    <NavExpandable id={id} isExpanded={active} isActive={active} title={title} data-quickstart-id={quickStartHighlightId}>
      {routes.map((item, index) => (
        <ChromeNavItemFactory key={index} {...item} />
      ))}
    </NavExpandable>
  );
};

export default ChromeNavExapandable;
