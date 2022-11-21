import React, { createContext } from 'react';
import componentMapper from './componentMapper';

export type OnLinkClick = (
  event: React.MouseEvent<HTMLAnchorElement, MouseEvent> | React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  href: string
) => boolean | undefined;

interface NavContext {
  onLinkClick?: OnLinkClick;
  isNavOpen?: boolean;
  inPageLayout?: boolean;
  componentMapper: typeof componentMapper;
}

const NavContext = createContext<NavContext>({} as NavContext);

export default NavContext;
