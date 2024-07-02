import outdatedBrowser from 'outdated-browser-rework';
import 'outdated-browser-rework/dist/style.css';

// Latest versions as of time of writing.
// Based on Patternfly support page promising support only for "latest".
outdatedBrowser({
  browserSupport: {
    Chrome: 126,
    Firefox: 127,
    Edge: 126,
    Safari: 17,
    'Mobile Safari': 17,
  },
});
