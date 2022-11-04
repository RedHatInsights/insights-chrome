import React from 'react';
import PropTypes from 'prop-types';
import { NavGroup } from '@patternfly/react-core';

import WrenchIcon from '@patternfly/react-icons/dist/js/icons/wrench-icon';
import SecurityIcon from '@patternfly/react-icons/dist/js/icons/security-icon';
import TrendUpIcon from '@patternfly/react-icons/dist/js/icons/trend-up-icon';
import CodeIcon from '@patternfly/react-icons/dist/js/icons/code-icon';
import DatabaseIcon from '@patternfly/react-icons/dist/js/icons/database-icon';
import CloudIcon from '@patternfly/react-icons/dist/js/icons/cloud-upload-alt-icon';

import ChromeNavItemFactory from './ChromeNavItemFactory';
import { NavItem } from '../../@types/types';

const sectionTitleMapper = {
  wrench: <WrenchIcon />,
  shield: <SecurityIcon />,
  database: <DatabaseIcon />,
  cloud: <CloudIcon />,
  code: <CodeIcon />,
  'trend-up': <TrendUpIcon />,
};

export type ChromeNavGroupProps = {
  navItems: NavItem[];
  isHidden?: boolean;
  icon?: keyof typeof sectionTitleMapper;
  title: string;
};

const ChromeNavGroup = ({ navItems, isHidden, icon, title }: ChromeNavGroupProps) => {
  const filteredFedrampNavItems = navItems;

  if (isHidden) {
    return null;
  }

  const groupTitle = (
    <div>
      {icon && sectionTitleMapper[icon]}
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

ChromeNavGroup.propTypes = {
  navItems: PropTypes.array.isRequired,
  icon: PropTypes.oneOf(['wrench', 'shield', 'trend-up', 'database', 'cloud', 'code']),
  title: PropTypes.string.isRequired,
  isHidden: PropTypes.bool,
};

export default ChromeNavGroup;
