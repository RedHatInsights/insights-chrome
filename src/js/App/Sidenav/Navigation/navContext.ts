import { createContext } from 'react';

export type OnLinkClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent> | React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => boolean | undefined

interface NavContext {
  onLinkClick?: OnLinkClick,
  isNavOpen?: boolean,
  inPageLayout?: boolean
}

const NavContext = createContext<NavContext>({});

export default NavContext;
