import { cogLogout, createUser, getTokenWithAuthorizationCode, login } from './auth';

export const createFedrampAuthObject = () => ({
  getToken: () => getTokenWithAuthorizationCode(),
  getUser: () => createUser(),
  logout: () => cogLogout(),
  login: () => login('your_username', 'your_password'),
  qe: () => {
    //do nothing
  },
});
