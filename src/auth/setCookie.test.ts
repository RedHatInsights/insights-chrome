import { COOKIE_PATHS, buildCookieString, setCookie } from './setCookie';

describe('setCookie', () => {
  it('should call writer once for every COOKIE_PATHS entry with correct cookie string', async () => {
    const mockWriter = jest.fn();
    await setCookie('token+token+token', 123, mockWriter);
    expect(mockWriter).toHaveBeenCalledTimes(COOKIE_PATHS.length);
    COOKIE_PATHS.forEach((path, index) => {
      expect(mockWriter).toHaveBeenNthCalledWith(index + 1, buildCookieString('cs_jwt', 'token+token+token', path, 123));
    });
  });

  it('should not call writer when token is too short', async () => {
    const mockWriter = jest.fn();
    await setCookie('short', 123, mockWriter);
    expect(mockWriter).not.toHaveBeenCalled();
  });

  it('should not call writer when token is empty', async () => {
    const mockWriter = jest.fn();
    await setCookie('', 123, mockWriter);
    expect(mockWriter).not.toHaveBeenCalled();
  });

  it('should use setCookieWrapper by default', async () => {
    await setCookie('token+token+token', 123);
    expect(document.cookie).toContain('cs_jwt=token+token+token');
  });
});

describe('COOKIE_PATHS', () => {
  it('should contain all seven expected API paths', () => {
    expect(COOKIE_PATHS).toEqual([
      '/wss',
      '/ws',
      '/api/tasks/v1',
      '/api/automation-hub',
      '/api/remediations/v1',
      '/api/edge/v1',
      '/api/crc-pdf-generator/v2/create',
    ]);
  });
});

describe('buildCookieString', () => {
  it('should include SameSite=Lax attribute', () => {
    const result = buildCookieString('cs_jwt', 'mytoken', '/wss', 123);
    expect(result).toContain('SameSite=Lax');
  });

  it('should include secure=true attribute', () => {
    const result = buildCookieString('cs_jwt', 'mytoken', '/wss', 123);
    expect(result).toContain('secure=true');
  });

  it('should include the correct path', () => {
    const result = buildCookieString('cs_jwt', 'mytoken', '/api/edge/v1', 123);
    expect(result).toContain('path=/api/edge/v1');
  });

  it('should set correct expiry from timestamp', () => {
    const result = buildCookieString('cs_jwt', 'mytoken', '/wss', 123);
    expect(result).toContain('expires=Thu, 01 Jan 1970 00:02:03 GMT');
  });

  it('should include cookie name and token', () => {
    const result = buildCookieString('cs_jwt', 'mytoken', '/wss', 123);
    expect(result).toContain('cs_jwt=mytoken');
  });

  it('should produce correct full cookie string for each path', () => {
    COOKIE_PATHS.forEach((path) => {
      const result = buildCookieString('cs_jwt', 'tok', path, 123);
      expect(result).toBe(`cs_jwt=tok;path=${path};secure=true;SameSite=Lax;expires=Thu, 01 Jan 1970 00:02:03 GMT`);
    });
  });
});
