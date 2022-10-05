import { createBrowserHistory } from 'history';
import { isBeta } from './common';

const history = createBrowserHistory({
  basename: isBeta() ? '/beta' : '/',
});

export default history;
