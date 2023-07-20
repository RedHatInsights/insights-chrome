import AllServicesIcons from './AllServicesIcons';

export type AllServicesLink = {
  href: string;
  title: string;
  subtitle?: string;
  description?: string;
  isExternal?: boolean;
  prod?: boolean;
  ITLess?: boolean;
};
export type AllServicesGroup = {
  isGroup: true;
  title: string;
  ITLess?: boolean;
  links: AllServicesLink[];
  description?: string;
};
export type AllServicesSection = {
  id?: string;
  icon?: keyof typeof AllServicesIcons;
  ITLess?: boolean;
  title: string;
  description?: string;
  links: (AllServicesLink | AllServicesGroup)[];
};

export const isAllServicesGroup = (item: unknown): item is AllServicesGroup => {
  return (item as AllServicesGroup).isGroup === true;
};

export function isAllServicesLink(item: unknown): item is AllServicesLink {
  return !!(item as AllServicesLink).href;
}
