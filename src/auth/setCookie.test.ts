import { setCookie } from './setCookie';

describe('setCookie', () => {
  // the time is set to 2 minutes and 3 seconds by the `expiresAt` parameter
  const cookieRegex = /cs_jwt=token\+token\+token;.*;secure=true;expires=Thu, 01 Jan 1970 00:02:03 GMT/;
  it('should set the cookie for various API pathnames', () => {
    // console.log(Cookies);
    // const cookiesSetSpy = jest.spyOn(Cookies, 'set');
    setCookie('token+token+token', 123);
    expect(window.document.cookie).toMatch(cookieRegex);
  });
});
