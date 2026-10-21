import { useLoadModule } from '@scalprum/react-core';
import { useEffect, useState } from 'react';
import { useDarkModeIsDark } from '../chrome/darkModeStoreBridge';

const LIGHTWELL_LOGO_LIGHT = '/apps/frontend-assets/partners-icons/lightwell-logomark-light.svg';
const LIGHTWELL_LOGO_DARK = '/apps/frontend-assets/partners-icons/lightwell-logomark-dark.svg';

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });

// Scalprum currently exposes readiness via useLoadModule and rendering/error/retry handling
// via ScalprumComponent. Lightwell therefore observes the same remote before mounting its
// Page shell; Scalprum coordinates the cached load. Replace this with a combined API if one
// is added in the future.
const useLightwellApp = () => {
  const [lightwellApp, lightwellAppError] = useLoadModule({ scope: 'contentSources', module: './LightwellApp' }, undefined);
  const isDark = useDarkModeIsDark();
  const [loadedLogo, setLoadedLogo] = useState<string>();
  const logo = isDark ? LIGHTWELL_LOGO_DARK : LIGHTWELL_LOGO_LIGHT;

  useEffect(() => {
    let active = true;
    preloadImage(logo).then(() => {
      if (active) {
        setLoadedLogo(logo);
      }
    });
    return () => {
      active = false;
    };
  }, [logo]);

  const logoReady = loadedLogo === logo;
  return [logoReady ? lightwellApp : undefined, logoReady ? lightwellAppError : undefined] as const;
};

export default useLightwellApp;
