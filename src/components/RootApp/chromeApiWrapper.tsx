import { ChromeAPI } from '@redhat-cloud-services/types';

const chromeApiWrapper = (chromeApi: ChromeAPI): ChromeAPI => {
  //chromeApi.forceDemo;
  Object.keys(chromeApi).map((item) => {
    if (typeof chromeApi[item as keyof ChromeAPI] == 'function') {
      const originalCall = chromeApi[item as keyof ChromeAPI];
      console.error('Do not use chrome api call from window. It has been deprecated.');
      return { ...chromeApi, [item]: originalCall };
    }
  });
  return chromeApi;
};

export default chromeApiWrapper;
