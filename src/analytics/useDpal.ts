import { useFlag } from '@unleash/proxy-client-react';
import { useEffect, useRef } from 'react';

function useDPAL() {
  const dpalAdded = useRef(false);
  const enableDPAL = useFlag('platform.chrome.analytics.dpal');
  function addDpalScript() {
    // setup adobe analytics
    if (!enableDPAL || dpalAdded.current) {
      return;
    }
    // ADD FF to enable adobe analytics
    const dpalScript = document.createElement('script');
    dpalScript.src = 'https://www.redhat.com/ma/dpal.js';
    dpalScript.type = 'text/javascript';
    dpalScript.id = 'dpal-script';
    dpalScript.onload = () => {
      if (typeof window._satellite !== 'undefined' && typeof window._satellite.pageBottom === 'function') {
        window._satellite.pageBottom();
        dpalAdded.current = true;
      }
    };
    if (!document.getElementById('dpal-script')) {
      document.body.appendChild(dpalScript);
    }
  }
  useEffect(() => {
    addDpalScript();
  }, [enableDPAL]);
}

export default useDPAL;
