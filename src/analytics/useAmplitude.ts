import { useFlag } from '@unleash/proxy-client-react';
import { useEffect, useRef } from 'react';
import { useSegment } from './useSegment';

// TODO should we read the key from the active module definition (tenants provide their own amplitude key)?
// The segment key does not seem to work for amplitude. We may also need to consider dev vs. prod keys.
const AMPLITUDE_KEY_FALLBACK = '';

function useAmplitude() {
  const amplitudeAdded = useRef(false);
  const enableAmplitude = useFlag('platform.chrome.analytics.amplitude');
  const { analytics, ready } = useSegment();

  function initializeAmplitude() {
    analytics?.ready(() => {
      // TODO error handling and try/catch
      analytics.user().then((user) => {
        window.engagement?.boot({
          user: {
            user_id: user.id(),
            device_id: user.anonymousId(),
            user_properties: {},
          },
          integrations: [
            {
              // @ts-expect-error any type
              track: (event) => {
                analytics.track(event.event_type, event.event_properties);
              },
            },
          ],
        });
        // TODO: Why do we need to replay segment events to amplitude?
        // Amplitude claims this is necessary to forward events from Segment to enable event-based
        // triggers for Guides and Surveys.
        analytics.on('track', (event, properties) => {
          window.engagement?.forwardEvent({ event_type: event, event_properties: properties });
        });
        analytics.on('page', (event, properties) => {
          window.engagement?.forwardEvent({ event_type: event, event_properties: properties });
        });
      });
    });
  }

  function addAmplitudeScript() {
    if (!enableAmplitude || !ready || amplitudeAdded.current) {
      return;
    }
    const amplitudeScript = document.createElement('script');
    amplitudeScript.src = `https://cdn.amplitude.com/script/${AMPLITUDE_KEY_FALLBACK}.engagement.js`;
    amplitudeScript.type = 'text/javascript';
    amplitudeScript.id = 'amplitude-script';
    amplitudeScript.onload = () => {
      // TODO error handling/logging
      if (typeof window.engagement !== 'undefined' && typeof window.engagement.boot === 'function') {
        initializeAmplitude();
        amplitudeAdded.current = true;
      }
    };
    if (!document.getElementById(amplitudeScript.id)) {
      document.body.appendChild(amplitudeScript);
    }
  }

  useEffect(() => {
    addAmplitudeScript();
  }, [enableAmplitude, ready]);
}

export default useAmplitude;
