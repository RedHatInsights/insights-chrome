import logger from './logger';

const log = logger('auth/setCookie.ts');

function setCookieWrapper(str: string) {
  window.document.cookie = str;
}

const DEFAULT_COOKIE_NAME = 'cs_jwt';

function getCookieExpires(exp: number) {
  // we want the cookie to expire at the same time as the JWT session
  // so we take the exp and get a new GTMString from that
  const date = new Date(0);
  date.setUTCSeconds(exp);
  return date.toUTCString();
}

export async function setCookie(token: string, expiresAt: number) {
  log('Setting the cs_jwt cookie');
  if (token && token.length > 10) {
    const cookieName = DEFAULT_COOKIE_NAME;
    if (cookieName) {
      setCookieWrapper(`${cookieName}=${token};` + `path=/wss;` + `secure=true;` + `expires=${getCookieExpires(expiresAt)}`);
      setCookieWrapper(`${cookieName}=${token};` + `path=/ws;` + `secure=true;` + `expires=${getCookieExpires(expiresAt)}`);
      setCookieWrapper(`${cookieName}=${token};` + `path=/api/tasks/v1;` + `secure=true;` + `expires=${getCookieExpires(expiresAt)}`);
      setCookieWrapper(`${cookieName}=${token};` + `path=/api/automation-hub;` + `secure=true;` + `expires=${getCookieExpires(expiresAt)}`);
      setCookieWrapper(`${cookieName}=${token};` + `path=/api/remediations/v1;` + `secure=true;` + `expires=${getCookieExpires(expiresAt)}`);
      setCookieWrapper(`${cookieName}=${token};` + `path=/api/edge/v1;` + `secure=true;` + `expires=${getCookieExpires(expiresAt)}`);
      setCookieWrapper(`${cookieName}=${token};` + `path=/api/crc-pdf-generator/v2/create;` + `secure=true;` + `expires=${getCookieExpires(expiresAt)}`);
    }
  }
}
