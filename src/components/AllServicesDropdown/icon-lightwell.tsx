import React from 'react';

const LightwellIcon = () => {
  return (
    <svg className="platform-icon allservices-icon" width="28" height="28" viewBox="71 71 109 109">
      <defs>
        <linearGradient
          id="lightwell-grad-1"
          x1="85.02334"
          y1="139.18698"
          x2="139.0252"
          y2="85.15837"
          gradientTransform="translate(.05683 -.11206) rotate(.01419)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#8d8d8d" />
          <stop offset="1" stopColor="#c6c6c6" />
        </linearGradient>
        <linearGradient
          id="lightwell-grad-2"
          x1="4772.45954"
          y1="-6295.98291"
          x2="4718.44617"
          y2="-6349.96954"
          gradientTransform="translate(4913.07821 -6182.72164) rotate(-179.98581)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fccb8f" />
          <stop offset="1" stopColor="#e00" />
        </linearGradient>
      </defs>
      <polygon points="71.55994 71.61423 71.55994 125.59698 125.52948 179.57973 125.55994 71.57973" fill="url(#lightwell-grad-1)" />
      <polygon points="179.55994 179.57973 179.55994 125.57973 125.55994 125.57973" fill="url(#lightwell-grad-2)" />
      <polygon points="125.55994 125.57973 125.55994 179.57973 179.55994 179.57973" fill="#f4f4f4" />
    </svg>
  );
};
export default LightwellIcon;
