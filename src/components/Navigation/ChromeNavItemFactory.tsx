import React, { useContext } from 'react';
import { ChromeNavExpandableProps, ChromeNavGroupProps, ChromeNavItemProps, DynamicNavProps } from '../../@types/types';
import NavContext from './navContext';

export type ChromeNavItemFactoryProps = {
  groupId?: string;
  expandable?: boolean;
  dynamicNav?: string;
};

const isNavExpandableProps = (props: Record<string, any>, expandable?: boolean): props is ChromeNavExpandableProps => expandable === true;
const isNavGroupProps = (props: Record<string, any>, groupId?: string): props is ChromeNavGroupProps => typeof groupId === 'string';
const isDynamicNavProps = (props: Record<string, any>, dynamicNav?: string): props is DynamicNavProps => typeof dynamicNav === 'string';

const ChromeNavItemFactory = ({ groupId, expandable, dynamicNav, ...rest }: ChromeNavItemFactoryProps) => {
  const { componentMapper } = useContext(NavContext);
  const props = rest;
  if (isNavGroupProps(props, groupId)) {
    return <componentMapper.group {...props} />;
  } else if (isNavExpandableProps(props, expandable)) {
    return <componentMapper.expandable {...props} />;
  } else if (isDynamicNavProps(props, dynamicNav)) {
    return <componentMapper.dynamicNav {...props} dynamicNav={dynamicNav!} />;
  } else {
    return <componentMapper.item {...(props as ChromeNavItemProps)} />;
  }
};

export default ChromeNavItemFactory;
