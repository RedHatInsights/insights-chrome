import { useFlag } from '@unleash/proxy-client-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useSegment } from './useSegment';
import { isProd } from '../utils/common';
import { useAtomValue } from 'jotai';
import { activeModuleDefinitionReadAtom } from '../state/atoms/activeModuleAtom';
import * as amplitude from '@amplitude/analytics-browser';
import { autocapturePlugin } from '@amplitude/plugin-autocapture-browser';

const AMPLITUDE_KEY_FALLBACK_DEV = 'dc3aabccff4063af0de96d7825422d8f';
const AMPLITUDE_KEY_FALLBACK_PROD = '5c16029122229733b22f1d87567b437';

function useAmplitude() {
  const amplitudeAdded = useRef(false);
  const amplitudeSdkInitialized = useRef(false);
  const enableAmplitude = useFlag('platform.chrome.analytics.amplitude');
  const enableAmplitudeAutocapture = useFlag('platform.chrome.analytics.amplitude.autocapture');
  const { analytics, ready } = useSegment();
  const navigate = useNavigate();
  const forwardHandlerRef = useRef<((event: string, properties: Record<string, unknown>) => void) | null>(null);
  const activeModuleDefinition = useAtomValue(activeModuleDefinitionReadAtom);

  const moduleKeyProd = activeModuleDefinition?.analytics?.amplitude?.APIKey;
  const moduleKeyDev = activeModuleDefinition?.analytics?.amplitude?.APIKeyDev;
  const moduleKey = isProd() ? moduleKeyProd : moduleKeyDev;
  const keyFallback = isProd() ? AMPLITUDE_KEY_FALLBACK_PROD : AMPLITUDE_KEY_FALLBACK_DEV;
  const keyToUse = moduleKey || keyFallback;

  const detachAnalyticsHandlers = function () {
    if (typeof analytics?.off === 'function') {
      if (forwardHandlerRef.current) {
        analytics.off('track', forwardHandlerRef.current);
        analytics.off('page', forwardHandlerRef.current);
        forwardHandlerRef.current = null;
      }
    }
  };

  const initializeAmplitudeAutocapture = function () {
    if (!enableAmplitudeAutocapture || enableAmplitude || amplitudeSdkInitialized.current || !ready) {
      return;
    }

    // Validate API key before initialization
    if (typeof keyToUse !== 'string' || keyToUse.length <= 0) {
      console.error('Amplitude key is missing or malformed:', keyToUse);
      return;
    }

    // Set flag immediately to prevent re-entrancy during async initialization
    amplitudeSdkInitialized.current = true;

    analytics?.ready(() => {
      analytics
        .user()
        .then((user) => {
          try {
            amplitude.add(autocapturePlugin());
            amplitude.init(keyToUse, user.id() ?? undefined, {
              deviceId: user.anonymousId() ?? undefined,
              defaultTracking: {
                sessions: true,
                pageViews: false,
                formInteractions: true,
                fileDownloads: true,
              },
            });
            console.log('Amplitude SDK with autocapture initialized');
          } catch (error) {
            amplitudeSdkInitialized.current = false;
            console.error('Error initializing Amplitude SDK with autocapture', error);
          }
        })
        .catch((error) => {
          amplitudeSdkInitialized.current = false;
          console.error('Error getting user for Amplitude autocapture', error);
        });
    });
  };

  const initializeAmplitude = function () {
    return analytics
      ?.ready(() => {
        return analytics.user().then((user) => {
          // Note: by default amplitude will not allow calling boot multiple times unless you call shutdown first (logs warning to the console)
          // However calling shutdown will cause any open guides/surveys to flicker
          window.engagement?.boot({
            user: {
              user_id: user.id(),
              device_id: user.anonymousId(),
              user_properties: {},
            },
            integrations: [
              {
                track: (event: { event_type: string; event_properties: Record<string, unknown> }) => {
                  analytics.track(event.event_type, event.event_properties);
                },
              },
            ],
          });
          detachAnalyticsHandlers();
          const forwardHandler = (event: string, properties: Record<string, unknown>) => {
            window.engagement?.forwardEvent({ event_type: event, event_properties: properties });
          };
          forwardHandlerRef.current = forwardHandler;
          analytics.on('track', forwardHandler);
          analytics.on('page', forwardHandler);
          window.engagement?.setRouter((newUrl: string) => {
            navigate(newUrl);
          });
        });
      })
      .catch((error) => {
        console.error('Error initializing Amplitude', error);
      });
  };

  const addAmplitudeScript = function () {
    if (!enableAmplitude || !ready) {
      return;
    }
    if (amplitudeAdded.current) {
      initializeAmplitude();
      return;
    }
    if (typeof keyToUse !== 'string' || keyToUse.length <= 0) {
      console.error('Amplitude key is missing or malformed:', keyToUse);
      return;
    }
    const amplitudeScript = document.createElement('script');
    amplitudeScript.src = `https://cdn.amplitude.com/script/${keyToUse}.engagement.js`;
    amplitudeScript.type = 'text/javascript';
    amplitudeScript.id = 'amplitude-script';
    amplitudeScript.onload = () => {
      if (typeof window.engagement !== 'undefined' && typeof window.engagement.boot === 'function') {
        amplitudeAdded.current = true;
        initializeAmplitude();
      } else {
        console.error('Amplitude script loaded but unexpected engagement object', window.engagement);
      }
    };
    amplitudeScript.onerror = () => {
      console.error('Error loading Amplitude script', amplitudeScript.src);
    };
    if (!document.getElementById(amplitudeScript.id)) {
      document.body.appendChild(amplitudeScript);
    }
  };

  useEffect(() => {
    addAmplitudeScript();
    return () => {
      detachAnalyticsHandlers();
    };
  }, [enableAmplitude, ready, navigate, analytics, keyToUse]);

  useEffect(() => {
    initializeAmplitudeAutocapture();
  }, [enableAmplitudeAutocapture, enableAmplitude, ready, analytics, keyToUse]);
}

export default useAmplitude;
