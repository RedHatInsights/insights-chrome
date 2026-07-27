import React, { memo } from 'react';

/**
 * Lightwell "L" mark logo for the masthead.
 * Inline SVG to avoid dependency on frontend-assets scope availability.
 * Source: IBM_Lightwell_logo brand portal asset.
 */
const LightwellLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" className="chr-c-brand" aria-label="Lightwell" role="img" width="30" height="30">
    <defs>
      <linearGradient
        id="lightwell-masthead-a"
        x1="13.46"
        y1="67.63"
        x2="67.47"
        y2="13.6"
        gradientTransform="translate(.06 -.11) rotate(.01)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#8d8d8d" />
        <stop offset="1" stopColor="#c6c6c6" />
      </linearGradient>
      <linearGradient
        id="lightwell-masthead-b"
        x1="4700.9"
        y1="-6367.56"
        x2="4646.89"
        y2="-6421.55"
        gradientTransform="translate(4841.52 -6254.3) rotate(-179.99)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#fccb8f" />
        <stop offset="1" stopColor="#e00" />
      </linearGradient>
    </defs>
    <polygon points="0 0.03 0 54.02 53.97 108 54 0" fill="url(#lightwell-masthead-a)" />
    <polygon points="108 108 108 54 54 54" fill="url(#lightwell-masthead-b)" />
    <polygon points="54 54 54 108 108 108" fill="#f4f4f4" />
  </svg>
);

export default memo(LightwellLogo);
