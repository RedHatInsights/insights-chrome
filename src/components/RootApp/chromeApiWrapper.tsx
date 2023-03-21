import { ChromeAPI } from '@redhat-cloud-services/types';

const chromeApiWrapper = (chromeApi: ChromeAPI): ChromeAPI => {
  const internalApi = Object.keys(chromeApi).reduce((acc, curr) => {
    const key = curr as keyof ChromeAPI;
    const originalCall: ChromeAPI[typeof key] = chromeApi[key];
    if (typeof originalCall == 'function') {
      return {
        ...acc,
        [key]: (...args: Parameters<typeof originalCall>) => {
          console.error('Do not use chrome api call from window. It has been deprecated.');
          return originalCall(...args);
        },
      };
    }
    return acc;
  }, chromeApi);

  return internalApi;
};

export default chromeApiWrapper;
