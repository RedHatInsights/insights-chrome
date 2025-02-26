import React from 'react';
import { NavExpandable } from '@patternfly/react-core/dist/dynamic/components/Nav';
import ChromeNavItemFactory from './ChromeNavItemFactory';
import { ChromeNavExpandableProps } from '../../@types/types';

const ChromeNavExpandable = ({ title, routes, active, isHidden, id }: ChromeNavExpandableProps) => {
  if (isHidden || routes.length === 0) {
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

export default ChromeNavExpandable;
