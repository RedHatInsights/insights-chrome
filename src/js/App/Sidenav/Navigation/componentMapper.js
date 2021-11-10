import ChromeNavGroup from './ChromeNavGroup';
import ChromeNavExapandable from './ChromeNavExapandable';
import ChromeNavItem from './ChromeNavItem';
import DynamicNav from './DynamicNav';

const componentMapper = {
  group: ChromeNavGroup,
  expandable: ChromeNavExapandable,
  item: ChromeNavItem,
  dynamicNav: DynamicNav,
};

export default componentMapper;
