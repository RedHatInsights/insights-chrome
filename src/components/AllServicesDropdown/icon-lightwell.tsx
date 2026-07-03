import React from 'react';

const ContainerSecurityIcon = () => {
  return (
    <svg className="platform-icon allservices-icon" width="28" height="28" viewBox="0 0 38 38">
      <rect x="1" y="1" width="36" height="36" rx="9" fill="#000" stroke="#4D4D4D" strokeWidth="2" />
      <g transform="translate(6, 5)">
        {/* Shield */}
        <path d="M13,3 L5,6 L5,14 C5,19.5 8.5,24 13,25.5 C17.5,24 21,19.5 21,14 L21,6 Z" fill="#1A1A1A" stroke="#666" strokeWidth="1" />
        {/* Checkmark circle */}
        <circle cx="12" cy="17" r="3" fill="#FFF" />
        <path d="M10.5,17 L11.5,18 L13.5,16" stroke="#000" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Container hexagons */}
        <path d="M20,8 L23,6.5 L26,8 L26,11 L23,12.5 L20,11 Z" fill="#EE0000" stroke="#EE0000" strokeWidth="0.5" />
        <path d="M22,14 L25,12.5 L28,14 L28,17 L25,18.5 L22,17 Z" fill="#EE0000" stroke="#EE0000" strokeWidth="0.5" />
        <path d="M20,20 L23,18.5 L26,20 L26,23 L23,24.5 L20,23 Z" fill="#EE0000" stroke="#EE0000" strokeWidth="0.5" />
      </g>
    </svg>
  );
};
export default ContainerSecurityIcon as unknown as React.ComponentClass;
