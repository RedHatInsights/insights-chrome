import { useFlag } from '@unleash/proxy-client-react';
import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useRef } from 'react';
import { useSegment } from './useSegment';
import { isProd } from '../utils/common';
import { useAtomValue } from 'jotai';
import { activeModuleAtom, activeModuleDefinitionReadAtom } from '../state/atoms/activeModuleAtom';
import { chromeModulesAtom } from '../state/atoms/chromeModuleAtom';
import { isPreviewAtom } from '../state/atoms/releaseAtom';
import * as amplitude from '@amplitude/analytics-browser';
import { autocapturePlugin } from '@amplitude/plugin-autocapture-browser';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import { getUrl } from '../hooks/useBundle';

function useAmplitude() {
  const amplitudeAdded = useRef(false);
  const amplitudeSdkInitialized = useRef(false);
  const configWarningLogged = useRef(false);
  const enableAmplitude = useFlag('platform.chrome.analytics.amplitude');
  const enableAmplitudeAutocapture = useFlag('platform.chrome.analytics.amplitude.autocapture');
  const { analytics, ready } = useSegment();
  const navigate = useNavigate();
  const forwardHandlerRef = useRef<((event: string, properties: Record<string, unknown>) => void) | null>(null);
  const activeModuleDefinition = useAtomValue(activeModuleDefinitionReadAtom);
  const chromeModules = useAtomValue(chromeModulesAtom);
  const activeModule = useAtomValue(activeModuleAtom);
  const isPreview = useAtomValue(isPreviewAtom);
  const { user } = useContext(ChromeAuthContext);

  // Chrome-level analytics config from FEO (fed-mods.json analytics section)
  const chromeAnalytics = chromeModules['chrome']?.analytics;

  // Engagement keys: module-specific key takes priority, then chrome FEO config
  const moduleKeyProd = activeModuleDefinition?.analytics?.amplitude?.APIKey;
  const moduleKeyDev = activeModuleDefinition?.analytics?.amplitude?.APIKeyDev;
  const moduleKey = isProd() ? moduleKeyProd : moduleKeyDev;
  const chromeEngagementKey = isProd() ? chromeAnalytics?.APIKey : chromeAnalytics?.APIKeyDev;
  const keyToUse = moduleKey || chromeEngagementKey;

  // Autocapture keys: chrome FEO config
  const autocaptureKeyToUse = isProd() ? chromeAnalytics?.autocaptureAPIKey : chromeAnalytics?.autocaptureAPIKeyDev;

  // Warn once if FEO analytics config is missing expected keys
  useEffect(() => {
    if (configWarningLogged.current) {
      return;
    }
    // Only warn once chromeModules have been loaded (chrome entry exists)
    if (!chromeModules['chrome']) {
      return;
    }
    configWarningLogged.current = true;
    if (!chromeAnalytics) {
      console.warn('Amplitude: analytics section not found in FEO config (fed-mods.json). Amplitude will not initialize until config is available.');
      return;
    }
    if (!chromeAnalytics.APIKey || !chromeAnalytics.APIKeyDev) {
      console.warn('Amplitude: engagement API keys (APIKey/APIKeyDev) not found in FEO config (fed-mods.json analytics section).');
    }
    if (!chromeAnalytics.autocaptureAPIKey || !chromeAnalytics.autocaptureAPIKeyDev) {
      console.warn('Amplitude: autocapture API keys (autocaptureAPIKey/autocaptureAPIKeyDev) not found in FEO config (fed-mods.json analytics section).');
    }
  }, [chromeModules, chromeAnalytics]);

  const detachAnalyticsHandlers = function () {
    if (typeof analytics?.off === 'function') {
      if (forwardHandlerRef.current) {
        analytics.off('track', forwardHandlerRef.current);
        analytics.off('page', forwardHandlerRef.current);
        forwardHandlerRef.current = null;
      }
    }
  };

  // Initialize the Amplitude SDK once
  const initializeAmplitudeAutocapture = function () {
    if (!enableAmplitudeAutocapture || amplitudeSdkInitialized.current || !ready || !user) {
      return;
    }

    // Validate API key before initialization
    if (typeof autocaptureKeyToUse !== 'string' || autocaptureKeyToUse.length <= 0) {
      console.error('Amplitude autocapture key is missing or malformed:', autocaptureKeyToUse);
      return;
    }

    // Set flag immediately to prevent re-entrancy during async initialization
    amplitudeSdkInitialized.current = true;

    analytics?.ready(() => {
      analytics
        .user()
        .then((segmentUser) => {
          try {
            // Initialize Amplitude SDK with autocapture plugin
            amplitude.add(autocapturePlugin());
            const initPromise = amplitude.init(autocaptureKeyToUse, segmentUser.id() ?? undefined, {
              deviceId: segmentUser.anonymousId() ?? undefined,
              defaultTracking: {
                sessions: true,
                pageViews: true,
                formInteractions: true,
                fileDownloads: true,
              },
            });

            // Wait for init() to complete, then send initial identify()
            initPromise?.promise
              ?.then(() => {
                // Send initial user properties
                const filteredUserProperties = buildUserProperties();
                if (Object.keys(filteredUserProperties).length > 0) {
                  const identifyEvent = new amplitude.Identify();
                  Object.entries(filteredUserProperties).forEach(([key, value]) => {
                    // Type assertion: we've already filtered out undefined, value is a valid property type
                    identifyEvent.set(key, value as string | number | boolean | string[] | number[]);
                  });
                  amplitude.identify(identifyEvent);
                } else {
                  console.warn('No user properties to set for Amplitude autocapture');
                }
              })
              .catch((error) => {
                // Handle initialization promise rejection
                amplitudeSdkInitialized.current = false;
                console.error('Error during Amplitude SDK initialization promise', error);
              });
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

  // Build enriched user properties - extracted to helper function for reuse
  const buildUserProperties = function (): Record<string, unknown> {
    if (!user) {
      return {};
    }

    // Build enriched user properties from ChromeUser context
    // Property names match Segment conventions (camelCase for booleans, snake_case for IDs)
    const userProperties: Record<string, unknown> = {
      // REQUIRED: User context - matches Segment property names
      // Default to false if undefined to ensure property is always present
      internal: user.identity.user?.is_internal ?? false,

      // STRETCH GOALS: Additional high-value properties
      isBeta: isPreview,
      isOrgAdmin: user.identity.user?.is_org_admin,
      org_id: user.identity.internal?.org_id,

      // Additional organization context
      account_id: user.identity.internal?.account_id,
      account_number: user.identity.account_number,
      organization_name: user.identity.organization?.name,

      // Additional user context
      locale: user.identity.user?.locale,
      email_domain: user.identity.user?.email ? user.identity.user.email.split('@')[1]?.toLowerCase() : undefined,

      // Application context
      current_bundle: getUrl('bundle'),
      current_app: activeModule,

      // Entitlements
      ...Object.entries(user.entitlements || {}).reduce(
        (acc, [key, entitlement]) => ({
          ...acc,
          [`entitlement_${key}`]: entitlement.is_entitled,
          [`entitlement_${key}_trial`]: entitlement.is_trial,
        }),
        {}
      ),
    };

    // Filter out undefined values
    return Object.fromEntries(Object.entries(userProperties).filter(([, value]) => value !== undefined));
  };

  // Update user properties via identify() - called on navigation changes
  const updateAmplitudeUserProperties = function () {
    // Only update if SDK is already initialized
    if (!amplitudeSdkInitialized.current || !user) {
      return;
    }

    try {
      const filteredUserProperties = buildUserProperties();

      if (Object.keys(filteredUserProperties).length > 0) {
        const identifyEvent = new amplitude.Identify();
        Object.entries(filteredUserProperties).forEach(([key, value]) => {
          // Type assertion: we've already filtered out undefined, value is a valid property type
          identifyEvent.set(key, value as string | number | boolean | string[] | number[]);
        });
        // Send the identify event
        amplitude.identify(identifyEvent);
      } else {
        console.warn('No user properties to set for Amplitude autocapture');
      }
    } catch (error) {
      console.error('Error updating Amplitude user properties', error);
    }
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

  // Initialize Amplitude autocapture SDK once
  useEffect(() => {
    initializeAmplitudeAutocapture();
  }, [enableAmplitudeAutocapture, ready, analytics, autocaptureKeyToUse, user]);

  // Update user properties when activeModule or isPreview changes
  useEffect(() => {
    updateAmplitudeUserProperties();
  }, [activeModule, isPreview]);
}

export default useAmplitude;
