import './sass/chrome.scss';
import { chunkLoadErrorRefreshKey } from './utils/common';
import { CHROME_PF4_DEBUG } from './utils/debugFunctions';
import removePf4Styles from './utils/removePf4Styles';

if (localStorage.getItem(CHROME_PF4_DEBUG)) {
  removePf4Styles();
}

Object.keys(localStorage).map((key) => {
  if (key.includes(chunkLoadErrorRefreshKey)) {
    setTimeout(() => {
      localStorage.removeItem(key);
    }, 10_000);
  }
});

import('./bootstrap');
