import React from 'react';
import CookieConsentElement from './CookieConsentElement';

const LightwellFooter = () => (
  <footer className="pf-v6-u-p-md">
    <ul aria-label="Lightwell footer links">
      <CookieConsentElement />
    </ul>
  </footer>
);

export default LightwellFooter;
