import { useLayoutEffect } from 'react';
import { useSetAtom } from 'jotai';
import { layoutForceGlassThemeAtom } from '../state/atoms/releaseAtom';
import { LIGHTWELL_PATH } from '../utils/common';

const GLASS_THEME_CLASS = 'pf-v6-theme-glass';

const isLightwellRoute = window.location.pathname === LIGHTWELL_PATH || window.location.pathname.startsWith(`${LIGHTWELL_PATH}/`);

if (isLightwellRoute) {
  document.documentElement.classList.add(GLASS_THEME_CLASS);
}

type UseLightwellRouteSetupOptions = {
  enabled?: boolean;
};

/**
 * Applies the Lightwell glass theme synchronously before paint.
 * Also forces glass via layoutForceGlassThemeAtom for Header toolbar state.
 *
 * The theme class is also applied eagerly at module-eval time (above) so it
 * survives the AppPlaceholder → Lightwell component transition without a gap.
 */
const useLightwellRouteSetup = ({ enabled = true }: UseLightwellRouteSetupOptions = {}) => {
  const setLayoutForceGlassTheme = useSetAtom(layoutForceGlassThemeAtom);

  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    document.documentElement.classList.add(GLASS_THEME_CLASS);
    setLayoutForceGlassTheme(true);

    return () => {
      document.documentElement.classList.remove(GLASS_THEME_CLASS);
      setLayoutForceGlassTheme(false);
    };
  }, [enabled, setLayoutForceGlassTheme]);
};

export default useLightwellRouteSetup;
