import React, { useContext } from 'react';
import { ChromeNavExapandableProps, ChromeNavGroupProps, ChromeNavItemProps, DynamicNavProps } from '../../@types/types';
import NavContext from './navContext';

import WrenchIcon from '@patternfly/react-icons/dist/js/icons/wrench-icon';
import SecurityIcon from '@patternfly/react-icons/dist/js/icons/security-icon';
import TrendUpIcon from '@patternfly/react-icons/dist/js/icons/trend-up-icon';
import CodeIcon from '@patternfly/react-icons/dist/js/icons/code-icon';
import DatabaseIcon from '@patternfly/react-icons/dist/js/icons/database-icon';
import CloudIcon from '@patternfly/react-icons/dist/js/icons/cloud-upload-alt-icon';

export const sectionTitleMapper = {
  wrench: <WrenchIcon />,
  shield: <SecurityIcon />,
  database: <DatabaseIcon />,
  cloud: <CloudIcon />,
  code: <CodeIcon />,
  'trend-up': <TrendUpIcon />,
};

export type ChromeNavItemFactoryProps = {
  groupId?: string;
  expandable?: boolean;
  dynamicNav?: string;
};

const isNavExpandableProps = (props: Record<string, any>, expandable?: boolean): props is ChromeNavExapandableProps => expandable === true;
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
