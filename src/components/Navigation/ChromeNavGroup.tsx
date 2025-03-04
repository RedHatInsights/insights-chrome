import React from 'react';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { NavGroup } from '@patternfly/react-core/dist/dynamic/components/Nav';

import ChromeNavItemFactory, { sectionTitleMapper } from './ChromeNavItemFactory';
import { ChromeNavGroupProps } from '../../@types/types';

const ChromeNavGroup = ({ navItems, isHidden, icon, title }: ChromeNavGroupProps) => {
  const filteredFedrampNavItems = navItems;

  if (isHidden) {
    return null;
  }

  const groupTitle = (
    <div>
      {icon && (
        <Icon size="sm" className="pf-v6-u-mr-sm" isInline>
          {sectionTitleMapper[icon]}
        </Icon>
      )}
      {title}
    </div>
  );
  return (
    // PF does not allow node/element in the NavGroup prop types, hence the type cast
    <NavGroup className="chr-c-section-nav" id={title} title={groupTitle as unknown as string}>
      {filteredFedrampNavItems.map((item, index) => (
        <ChromeNavItemFactory key={index} {...item} />
      ))}
    </NavGroup>
  );
};

export default ChromeNavGroup;
