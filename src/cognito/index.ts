import { cogLogout, createUser, getTokenWithAuthorizationCode, login } from './auth';
import qe from '../utils/iqeEnablement';
import { Store } from 'redux';

export const createCognitoAuthObject = (store: Store) => ({
  getToken: () => getTokenWithAuthorizationCode(),
  getUser: () => createUser(),
  logout: () => cogLogout(),
  login: () => login('your_username', 'your_password'),
  qe: {
    ...qe,
    init: () => qe.init(store),
  },
});
