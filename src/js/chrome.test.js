import './test';
import { chromeInit } from './chrome/entry';
import * as actions from './redux/actions.js';

const mockedPromis = new Promise(() => {});
const mockedJwt = {
  getUserInfo: () => {
    return {
      then: () => {
        return { user: 'mock' };
      },
    };
  },
};

const getMockLibJwt = () => {
  return { initPromise: mockedPromis, jwt: mockedJwt };
};

describe('Chrome API', () => {
  test('can be initialized', () => {
    chromeInit(getMockLibJwt());
  });

  test('allows for an event listener to be registered', () => {
    const chrome = chromeInit(getMockLibJwt());
    chrome.on('APP_NAVIGATION', () => true);
  });

  test('throws an error if an unknown event listener registration is attempted', () => {
    const chrome = chromeInit(getMockLibJwt());
    expect(() => chrome.on('NON_EXISTENT_EVENT', () => true)).toThrowError('Unknown event type: NON_EXISTENT_EVENT');
  });

  test('allows for an event listener to be registered', () => {
    let result;
    const chrome = chromeInit(getMockLibJwt());
    chrome.on('APP_NAVIGATION', (event) => (result = event));

    chrome.$internal.store.dispatch(actions.appNavClick({ id: 'map' }, { target: document.createElement('button') }));
    expect(result.navId).toBe('map');
  });

  test('allows for an event listener to be unregistered', () => {
    let result;
    const chrome = chromeInit(getMockLibJwt());
    const unregister = chrome.on('APP_NAVIGATION', (event) => (result = event));

    chrome.$internal.store.dispatch(actions.appNavClick({ id: 'map' }, { target: document.createElement('button') }));
    unregister();
    chrome.$internal.store.dispatch(actions.appNavClick({ id: 'widgets' }, { target: document.createElement('i') }));

    expect(result.navId).toBe('map');
  });

  test('allows for an event GLOBAL_FILTER_UPDATE to be registered', () => {
    const callback = jest.fn();
    const chrome = chromeInit(getMockLibJwt());
    chrome.on('GLOBAL_FILTER_UPDATE', callback);

    chrome.$internal.store.dispatch(actions.globalFilterChange());
    expect(callback).toHaveBeenCalled();
    expect(callback.mock.calls.length).toBe(2);
  });

  test('should call callback without action triggered', () => {
    const callback = jest.fn();
    const chrome = chromeInit(getMockLibJwt());
    chrome.on('GLOBAL_FILTER_UPDATE', callback);

    expect(callback).toHaveBeenCalled();
    expect(callback.mock.calls.length).toBe(1);
  });

  test('allows for an event GLOBAL_FILTER_UPDATE to be unregistered', () => {
    const callback = jest.fn();
    const chrome = chromeInit(getMockLibJwt());
    const unregister = chrome.on('GLOBAL_FILTER_UPDATE', callback);
    unregister();
    chrome.$internal.store.dispatch(actions.globalFilterChange());
    expect(callback.mock.calls.length).toBe(1);
  });

  test('hides global filter', () => {
    const chrome = chromeInit(getMockLibJwt());
    chrome.hideGlobalFilter();
    expect(chrome.$internal.store.getState().globalFilter.globalFilterHidden).toBe(true);
  });

  test('shows global filter', () => {
    const chrome = chromeInit(getMockLibJwt());
    chrome.hideGlobalFilter(false);
    expect(chrome.$internal.store.getState().globalFilter.globalFilterHidden).toBe(false);
  });
});
