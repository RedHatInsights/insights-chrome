import { AnalyticsBrowser } from '@segment/analytics-next';

// reset segment integrations (pendo, intercom, ...) when API key has changed
export const resetIntegrations = (client: AnalyticsBrowser) => {
  client.ready(() => {
    try {
      const intercomDestination = client.instance?.queue.plugins.find((plugin) => plugin.name == 'Intercom Web (Actions)');
      const pendoDestination = client.instance?.queue.plugins.find((plugin) => plugin.name == 'Pendo');

      // if no intercom destination, teardown intercom if it exists
      if (!intercomDestination && window.Intercom) {
        window?.Intercom('shutdown');
        window.Intercom = undefined;
      }
      // if no pendo destination, teardown pendo if it exists
      if (!pendoDestination && window.pendo) {
        window.pendo?.flushNow?.();
        window.pendo?.setGuidesDisabled?.(true);
        window.pendo?.stopGuides?.();
        window.pendo?.stopSendingEvents?.();
        window.pendo = undefined;
      }

      // disable/enable pendo guides
      if (pendoDestination && window.pendo) {
        if (intercomDestination) {
          // disable pendo guides
          window.pendo?.setGuidesDisabled?.(true);
          window.pendo?.stopGuides?.();
        } else {
          // (re)enable pendo guides
          window.pendo?.setGuidesDisabled?.(false);
          window.pendo?.startGuides?.();
        }
      }
    } catch (error) {
      console.error('Unable to reset integrations. Reason: ', error);
    }
  });
};
