import { FavorableIcons } from '../FavoriteServices/ServiceIcon';

export type AllServicesLink = {
  href: string;
  icon?: FavorableIcons;
  title: string;
  subtitle?: string;
  description?: string;
  isExternal?: boolean;
  prod?: boolean;
};
export type AllServicesGroup = {
  isGroup: true;
  title: string;
  links: AllServicesLink[];
  description?: string;
};
export type AllServicesSection = {
  id?: string;
  icon?: FavorableIcons;
  title: string;
  description?: string;
  links: (AllServicesLink | AllServicesGroup)[];
};

export const isAllServicesGroup = (item: unknown): item is AllServicesGroup => {
  return (item as AllServicesGroup)?.isGroup === true;
};

export function isAllServicesLink(item: unknown): item is AllServicesLink {
  return !!(item as AllServicesLink)?.href;
}
