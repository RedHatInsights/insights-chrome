import React from 'react';
import { NavExpandable } from '@patternfly/react-core/dist/dynamic/components/Nav';
import ChromeNavItemFactory from './ChromeNavItemFactory';
import { ChromeNavExpandableProps } from '../../@types/types';

const ChromeNavExpandable = ({ title, navItems, active, isHidden, id }: ChromeNavExpandableProps) => {
  if (isHidden || !navItems || navItems.length === 0) {
    return null;
  }

  const quickStartHighlightId = title.replace(/\s/g, '-');
  return (
    <NavExpandable id={id} isExpanded={active} isActive={active} title={title} data-quickstart-id={quickStartHighlightId}>
      {navItems.map((item, index) => (
        <ChromeNavItemFactory key={index} {...item} />
      ))}
    </NavExpandable>
  );
};

export default ChromeNavExpandable;
