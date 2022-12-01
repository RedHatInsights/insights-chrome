import React from 'react';
import ChromeNavGroup from './ChromeNavGroup';
import ChromeNavExapandable from './ChromeNavExapandable';
import ChromeNavItem from './ChromeNavItem';
import DynamicNav from './DynamicNav';
import { ChromeNavExapandableProps, ChromeNavGroupProps, ChromeNavItemProps, DynamicNavProps } from '../../@types/types';

const componentMapper: {
  group: React.FC<ChromeNavGroupProps>;
  expandable: React.FC<ChromeNavExapandableProps>;
  item: React.FC<ChromeNavItemProps>;
  dynamicNav: React.FC<DynamicNavProps>;
} = {
  group: ChromeNavGroup,
  expandable: ChromeNavExapandable,
  item: ChromeNavItem,
  dynamicNav: DynamicNav,
};

export default componentMapper;
