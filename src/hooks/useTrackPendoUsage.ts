import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { useSegment } from '../analytics/useSegment';
import { activeModuleAtom } from '../state/atoms/activeModuleAtom';

const badgeQuery = 'div[id^="_pendo-badge_"]';
const RETRY_ATTEMPS = 10;
const RETRY_INTERVAL = 2000;
const SEGMENT_EVENT_NAME = 'pendo-badge-clicked';

const useTrackPendoUsage = () => {
  const activeModule = useAtomValue(activeModuleAtom);
  const mutableData = useRef({ activeModule });
  const { analytics } = useSegment();
  const setupEventTracking = useCallback(() => {
    analytics?.track(SEGMENT_EVENT_NAME, {
      application: mutableData.current.activeModule,
    });
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;
    let pendoBadgeElement: HTMLDivElement | null = document.querySelector(badgeQuery);
    try {
      // this feature is not critical, if any of the following fails, we just ignore it
      mutableData.current.activeModule = activeModule;
      let attempt = 0;
      if (!pendoBadgeElement) {
        // pendo badge was not loaded yet
        // try a few times to find it, then give up
        interval = setInterval(() => {
          if (attempt < RETRY_ATTEMPS) {
            attempt += 1;
            pendoBadgeElement = document.querySelector(badgeQuery);
            if (pendoBadgeElement) {
              clearInterval(interval);
              pendoBadgeElement.addEventListener('click', setupEventTracking);
            }
          } else {
            clearInterval(interval);
          }
        }, RETRY_INTERVAL);
      } else {
        pendoBadgeElement.addEventListener('click', setupEventTracking);
      }
    } catch (error) {
      console.error('Failed to setup pendo badge event tracking', error);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }

      if (pendoBadgeElement) {
        pendoBadgeElement.removeEventListener('click', setupEventTracking);
        pendoBadgeElement = null;
      }
    };
  }, [activeModule]);
};

export default useTrackPendoUsage;
