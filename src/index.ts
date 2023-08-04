import './sass/chrome.scss';
import { chunkLoadErrorRefreshKey, isBeta } from './utils/common';

Object.keys(localStorage).map((key) => {
  if (key.includes(chunkLoadErrorRefreshKey)) {
    setTimeout(() => {
      localStorage.removeItem(key);
    }, 10_000);
  }
});

// we can't use build to set base to /beta or /preview as they both share the same build
// base tag has to be adjusted once at start up
function adjustBase() {
  const baseTag = document.getElementsByTagName('base')?.[0];
  const previewFragment = window.location.pathname.split('/')?.[1];
  if (isBeta() && baseTag && previewFragment) {
    baseTag.href = `/${previewFragment}/`;
  }
}

adjustBase();

import('./bootstrap');
