import { createBrowserHistory } from 'history';
import { isBeta } from '../utils';

const history = createBrowserHistory({
  basename: isBeta() ? '/beta' : '/',
});

export default history;
