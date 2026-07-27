import React, { memo } from 'react';

/**
 * Lightwell logomark for the masthead.
 * Uses the official SVG from frontend-assets (partners-icons/lightwell-logomark.svg).
 */
const LightwellLogo = () => (
  <img className="chr-c-brand" src="/apps/frontend-assets/partners-icons/lightwell-logomark.svg" alt="Lightwell" width="30" height="30" />
);

export default memo(LightwellLogo);
