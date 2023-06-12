import React from 'react';
import ChromeNavGroup from './ChromeNavGroup';
import ChromeNavExpandable from './ChromeNavExpandable';
import ChromeNavItem from './ChromeNavItem';
import DynamicNav from './DynamicNav';
import { ChromeNavExpandableProps, ChromeNavGroupProps, ChromeNavItemProps, DynamicNavProps } from '../../@types/types';

const componentMapper: {
  group: React.FC<ChromeNavGroupProps>;
  expandable: React.FC<ChromeNavExpandableProps>;
  item: React.FC<ChromeNavItemProps>;
  dynamicNav: React.FC<DynamicNavProps>;
} = {
  group: ChromeNavGroup,
  expandable: ChromeNavExpandable,
  item: ChromeNavItem,
  dynamicNav: DynamicNav,
};

export default componentMapper;
