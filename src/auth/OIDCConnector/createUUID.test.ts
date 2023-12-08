import createUUID from './createUUID';

describe('createUUID', () => {
  it('should generate a valid UUID', () => {
    const uuid = createUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should generate a different UUID each time', () => {
    const uuid1 = createUUID();
    const uuid2 = createUUID();
    expect(uuid1).not.toBe(uuid2);
  });

  it('should generate a UUID with the correct length', () => {
    const uuid = createUUID();
    expect(uuid.length).toBe(36);
  });

  // test when a window.crypto is not available
  it('should generate a valid UUID when window.crypto is not available', () => {
    const crypto = window.crypto;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.crypto = null;
    const uuid = createUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    window.crypto = crypto;
  });
});
