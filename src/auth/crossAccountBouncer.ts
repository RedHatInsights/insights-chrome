import Cookies from 'js-cookie';
import { ACCOUNT_REQUEST_TIMEOUT, ACTIVE_REMOTE_REQUEST, CROSS_ACCESS_ACCOUNT_NUMBER, CROSS_ACCESS_ORG_ID } from '../utils/consts';

export default function crossAccountBouncer() {
  const requestCookie = Cookies.get(CROSS_ACCESS_ACCOUNT_NUMBER);
  if (requestCookie) {
    localStorage.setItem(ACCOUNT_REQUEST_TIMEOUT, requestCookie);
    localStorage.removeItem(ACTIVE_REMOTE_REQUEST);
  }
  Cookies.remove(CROSS_ACCESS_ACCOUNT_NUMBER);
  Cookies.remove(CROSS_ACCESS_ORG_ID);
  window.location.reload();
}
