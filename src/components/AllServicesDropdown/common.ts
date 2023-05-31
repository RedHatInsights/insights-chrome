import { createContext } from 'react';

export const TAB_CONTENT_ID = 'refTab1Section';
export const FAVORITE_TAB_ID = 'favorites';

export const AllServicesDropdownContext = createContext<{ onLinkClick: () => void }>({
  onLinkClick: () => undefined,
});
