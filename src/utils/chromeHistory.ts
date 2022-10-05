import { createBrowserHistory } from 'history';
import { isBeta } from '../js/utils';

const history = createBrowserHistory({
  basename: isBeta() ? '/beta' : '/',
});

export default history;
