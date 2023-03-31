// reset segment integrations (pendo, intercom, ...) when API key has changed
const resetIntegrations = () => {
  if (window.Intercom) {
    window?.Intercom('shutdown');
  }
  if (window.pendo) {
    window.pendo?.flushNow();
    window.pendo?.setGuidesDisabled(true);
    window.pendo?.stopGuides();
    window.pendo?.stopSendingEvents();
    window.pendo = undefined;
  }

  if (window.segment) {
    window.segment = undefined;
  }
};

export default resetIntegrations;
