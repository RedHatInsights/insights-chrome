import './sass/chrome.scss';
import { chunkLoadErrorRefreshKey } from './utils/common';

Object.keys(localStorage).map((key) => {
  if (key.includes(chunkLoadErrorRefreshKey)) {
    setTimeout(() => {
      localStorage.removeItem(key);
    }, 10_000);
  }
});

import('./bootstrap');
