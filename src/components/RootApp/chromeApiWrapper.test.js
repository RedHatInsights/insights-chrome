import chromeApiWrapper from './chromeApiWrapper';

describe('chromeApiWrapper', () => {
  it('should log an error', () => {
    const api = chromeApiWrapper({ forceDemo: (arg) => arg });
    const errorSpy = jest.spyOn(console, 'error');
    const forceDemoSpy = jest.spyOn(api, 'forceDemo');
    api.forceDemo('foo');

    expect(forceDemoSpy).toHaveBeenCalledWith('foo');
    expect(errorSpy).toHaveBeenCalledWith('Do not use chrome api call from window. It has been deprecated.');

    errorSpy.mockReset();
  });
});
