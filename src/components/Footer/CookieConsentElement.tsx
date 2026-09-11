import React, { useLayoutEffect, useRef } from 'react';

const CookieConsentElement = () => {
  // TrustArc injects a single #teconsent node. Footers remount across routes,
  // so we reparent it into this list item before paint and park it on body on
  // unmount so the next footer can find it.
  const consentRef = useRef<HTMLLIElement>(null);

  useLayoutEffect(() => {
    const host = consentRef.current;
    const consentElement = document.getElementById('teconsent');
    if (host && consentElement) {
      host.appendChild(consentElement);
    }

    return () => {
      const hosted = host?.querySelector('#teconsent');
      if (hosted) {
        document.body.appendChild(hosted);
      }
    };
  }, []);

  return <li ref={consentRef}></li>;
};

export default CookieConsentElement;
