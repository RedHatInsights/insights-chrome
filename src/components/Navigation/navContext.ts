import React, { createContext } from 'react';
import { ChromeNavExpandableProps, ChromeNavGroupProps, ChromeNavItemProps, DynamicNavProps } from '../../@types/types';

export type OnLinkClick = (
  event: React.MouseEvent<HTMLAnchorElement, MouseEvent> | React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  href: string
) => boolean | undefined;

interface NavContext {
  onLinkClick?: OnLinkClick;
  isNavOpen?: boolean;
  inPageLayout?: boolean;
  componentMapper: {
    group: React.FC<ChromeNavGroupProps>;
    expandable: React.FC<ChromeNavExpandableProps>;
    item: React.FC<ChromeNavItemProps>;
    dynamicNav: React.FC<DynamicNavProps>;
  };
}

const NavContext = createContext<NavContext>({} as NavContext);

export default NavContext;
