import React from 'react';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { NavGroup } from '@patternfly/react-core/dist/dynamic/components/Nav';

import ChromeNavItemFactory from './ChromeNavItemFactory';
import { ChromeNavGroupProps } from '../../@types/types';

import WrenchIcon from '@patternfly/react-icons/dist/dynamic/icons/wrench-icon';
import SecurityIcon from '@patternfly/react-icons/dist/dynamic/icons/security-icon';
import TrendUpIcon from '@patternfly/react-icons/dist/dynamic/icons/trend-up-icon';
import CodeIcon from '@patternfly/react-icons/dist/dynamic/icons/code-icon';
import DatabaseIcon from '@patternfly/react-icons/dist/dynamic/icons/database-icon';
import CloudIcon from '@patternfly/react-icons/dist/dynamic/icons/cloud-upload-alt-icon';

const sectionTitleMapper = {
  wrench: <WrenchIcon />,
  shield: <SecurityIcon />,
  database: <DatabaseIcon />,
  cloud: <CloudIcon />,
  code: <CodeIcon />,
  'trend-up': <TrendUpIcon />,
};

const ChromeNavGroup = ({ navItems, isHidden, icon, title }: ChromeNavGroupProps) => {
  const filteredFedrampNavItems = navItems;

  if (isHidden) {
    return null;
  }

  const groupTitle = (
    <div>
      {icon && (
        <Icon size="sm" className="pf-v5-u-mr-sm" isInline>
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
