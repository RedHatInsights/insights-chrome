import logger from './logger';

const log = logger('auth/setCookie.ts');

export function setCookieWrapper(str: string) {
  window.document.cookie = str;
}

const DEFAULT_COOKIE_NAME = 'cs_jwt';

export const COOKIE_PATHS = ['/wss', '/ws', '/api/tasks/v1', '/api/automation-hub', '/api/remediations/v1', '/api/edge/v1', '/api/crc-pdf-generator/v2/create'];

function getCookieExpires(exp: number) {
  // we want the cookie to expire at the same time as the JWT session
  // so we take the exp and get a new GTMString from that
  const date = new Date(0);
  date.setUTCSeconds(exp);
  return date.toUTCString();
}

export function buildCookieString(cookieName: string, token: string, path: string, expiresAt: number): string {
  return `${cookieName}=${token};path=${path};secure=true;SameSite=Lax;expires=${getCookieExpires(expiresAt)}`;
}

export async function setCookie(token: string, expiresAt: number, writer: (str: string) => void = setCookieWrapper) {
  log('Setting the cs_jwt cookie');
  if (token && token.length > 10) {
    const cookieName = DEFAULT_COOKIE_NAME;
    if (cookieName) {
      COOKIE_PATHS.forEach((path) => {
        writer(buildCookieString(cookieName, token, path, expiresAt));
      });
    }
  }
}
