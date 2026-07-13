import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import axios from 'axios';
import { BundleNavigation, NavItem } from '../../@types/types.d';
import { evaluateVisibility } from '../../utils/isNavItemVisible';
import fetchNavigationFiles from '../../utils/fetchNavigationFiles';
import { getChromeStaticPathname } from '../../utils/common';
import useFeoConfig from '../../hooks/useFeoConfig';
import { useFlagsStatus } from '@unleash/proxy-client-react';
import { AllServicesGroup, AllServicesLink, AllServicesSection, isAllServicesGroup, isAllServicesLink } from '../../components/AllServices/allServicesLinks';

export const visibleBundlesAtom = atom<BundleNavigation[]>([]);
export const visibleBundlesReadyAtom = atom(false);
export const visibleBundlesErrorAtom = atom(false);
export const visibleServiceTilesAtom = atom<AllServicesSection[]>([]);
export const visibleServiceTilesReadyAtom = atom(false);
export const visibleServiceTilesErrorAtom = atom(false);

export const filterHiddenItems = (navItems: NavItem[]): NavItem[] => {
  return navItems
    .filter((item) => !item.isHidden)
    .map((item) => ({
      ...item,
      ...(item.navItems ? { navItems: filterHiddenItems(item.navItems) } : {}),
      ...(item.routes ? { routes: filterHiddenItems(item.routes) } : {}),
    }));
};

const evaluateBundleNavItems = async (bundles: BundleNavigation[]): Promise<BundleNavigation[]> => {
  return Promise.all(
    bundles.map(async (bundle) => {
      const evaluated = await Promise.all((bundle.navItems ?? []).map(evaluateVisibility));
      return { ...bundle, navItems: filterHiddenItems(evaluated) };
    })
  );
};

export const evaluateServiceTilesVisibility = async (sections: AllServicesSection[]): Promise<AllServicesSection[]> => {
  return Promise.all(
    sections.map(async (section) => {
      const evaluatedLinks = await Promise.all(
        section.links.map(async (link) => {
          if (isAllServicesGroup(link) && link.links) {
            const links = await Promise.all(link.links.map(evaluateVisibility));
            return { ...link, links } as AllServicesGroup;
          } else if (isAllServicesLink(link)) {
            return evaluateVisibility(link);
          }
          return link;
        })
      );

      const visibleLinks = evaluatedLinks.filter((link) => {
        if (!link) return false;
        if ((link as NavItem).isHidden) return false;
        return true;
      });

      const linksWithFilteredGroups = visibleLinks.map((link) => {
        if (isAllServicesGroup(link as AllServicesGroup)) {
          return { ...(link as AllServicesGroup), links: (link as AllServicesGroup).links.filter((item) => !(item as NavItem).isHidden) };
        }
        return link;
      }) as (AllServicesLink | AllServicesGroup)[];

      return { ...section, links: linksWithFilteredGroups };
    })
  );
};

const GENERATED_SERVICES_PATH = '/api/chrome-service/v1/static/service-tiles-generated.json';

/**
 * Single initializer hook — call once, high in the component tree.
 * Fetches bundles and service tiles, evaluates visibility, and writes to atoms.
 * Consumers use useVisibleBundles() / useVisibleServiceTiles() which only read.
 */
export const useInitVisibleBundles = () => {
  const feoGenerated = useFeoConfig();
  const { flagsReady, flagsError } = useFlagsStatus();
  const setBundles = useSetAtom(visibleBundlesAtom);
  const setBundlesReady = useSetAtom(visibleBundlesReadyAtom);
  const setBundlesError = useSetAtom(visibleBundlesErrorAtom);
  const setTiles = useSetAtom(visibleServiceTilesAtom);
  const setTilesReady = useSetAtom(visibleServiceTilesReadyAtom);
  const setTilesError = useSetAtom(visibleServiceTilesErrorAtom);

  useEffect(() => {
    if (!flagsReady && !flagsError) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    setBundlesError(false);
    setTilesError(false);

    fetchNavigationFiles(feoGenerated)
      .then(evaluateBundleNavItems)
      .then((result) => {
        if (!cancelled) {
          setBundles(result);
          setBundlesReady(true);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to fetch and evaluate bundles', error);
        setBundlesError(true);
        setBundlesReady(true);
      });

    const tilesQuery = feoGenerated ? GENERATED_SERVICES_PATH : `${getChromeStaticPathname('services')}/services-generated.json`;
    axios
      .get<AllServicesSection[]>(tilesQuery, {
        signal: controller.signal,
      })
      .then((response) => evaluateServiceTilesVisibility(response.data))
      .then((result) => {
        if (!cancelled) {
          setTiles(result);
          setTilesReady(true);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to fetch and evaluate service tiles', error);
        setTilesError(true);
        setTilesReady(true);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [feoGenerated, flagsReady, flagsError]);
};

export const useVisibleBundles = () => {
  return useAtomValue(visibleBundlesAtom);
};

export const useVisibleBundlesReady = () => {
  return useAtomValue(visibleBundlesReadyAtom);
};

export const useVisibleBundlesError = () => {
  return useAtomValue(visibleBundlesErrorAtom);
};

export const useVisibleServiceTiles = () => {
  const tiles = useAtomValue(visibleServiceTilesAtom);
  const ready = useAtomValue(visibleServiceTilesReadyAtom);
  const error = useAtomValue(visibleServiceTilesErrorAtom);
  return { tiles, ready, error };
};
