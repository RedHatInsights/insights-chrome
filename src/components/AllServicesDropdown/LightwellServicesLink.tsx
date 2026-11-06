import React from 'react';
import ChromeLink from '../ChromeLink';
import { useDarkModeIsDark } from '../../chrome/darkModeStoreBridge';
import { lightwellLogoDark, lightwellLogoLight } from '../Header/logoAssets';

const LightwellServicesLink = () => {
  const isDark = useDarkModeIsDark();
  const src = isDark ? lightwellLogoDark : lightwellLogoLight;

  return (
    <ChromeLink
      href="/lightwell"
      data-ouia-component-id="AllServices-Dropdown-Lightwell"
      className="chr-m-plain pf-v6-u-display-block pf-v6-u-px-lg pf-v6-u-mb-0"
    >
      <img src={src} alt="Lightwell" height="22" />
    </ChromeLink>
  );
};
export default LightwellServicesLink;
