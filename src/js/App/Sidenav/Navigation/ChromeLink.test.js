/* eslint-disable react/prop-types */
import React from 'react';
import { Provider } from 'react-redux';
import { render, act, fireEvent } from '@testing-library/react';
import createMockStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import ChromeLink from './ChromeLink';
import NavContext from './navContext';
import { APP_NAV_CLICK } from '../../../redux/action-types';

const LinkContext = ({
  store,
  providerValue = {
    onLinkClick: jest.fn(),
  },
  children,
}) => (
  <MemoryRouter>
    <Provider store={store}>
      <NavContext.Provider value={providerValue}>{children}</NavContext.Provider>
    </Provider>
  </MemoryRouter>
);

describe('ChromeLink', () => {
  const mockStore = createMockStore();
  const testProps = {
    appId: 'testModule',
    href: '/insights/foo',
  };

  test('should pick react router link for dynamic module', () => {
    const store = mockStore({
      chrome: {
        activeModule: 'testModule',
        modules: {
          testModule: {},
        },
      },
    });
    const { getAllByTestId } = render(
      <LinkContext store={store}>
        <ChromeLink {...testProps}>Test module link</ChromeLink>
      </LinkContext>
    );

    expect(getAllByTestId('router-link')).toHaveLength(1);
  });

  test('should pick native link for non dynamic module', () => {
    const store = mockStore({
      chrome: {
        activeModule: 'differentModule',
        modules: {
          differentModule: {
            dynamic: false,
          },
          testModule: {},
        },
      },
    });
    const { getAllByTestId } = render(
      <LinkContext store={store}>
        <ChromeLink {...testProps}>Test module link</ChromeLink>
      </LinkContext>
    );

    expect(getAllByTestId('native-link')).toHaveLength(1);
  });

  test('should dispatch appNavClick with correct actionId for top level route', () => {
    const store = mockStore({
      chrome: {
        activeModule: 'testModule',
        modules: {
          testModule: {},
        },
      },
    });
    const {
      container: { firstElementChild: buttton },
    } = render(
      <LinkContext store={store}>
        <ChromeLink {...testProps}>Test module link</ChromeLink>
      </LinkContext>
    );

    act(() => {
      fireEvent.click(buttton);
    });

    expect(store.getActions()).toEqual([
      {
        type: APP_NAV_CLICK,
        payload: {
          id: 'foo',
          event: {
            id: 'foo',
            navId: 'foo',
            href: '/insights/foo',
          },
        },
      },
    ]);
  });

  test('should dispatch appNavClick with correct actionId for nested route', () => {
    const store = mockStore({
      chrome: {
        activeModule: 'testModule',
        modules: {
          testModule: {},
        },
      },
    });
    const {
      container: { firstElementChild: buttton },
    } = render(
      <LinkContext store={store}>
        <ChromeLink {...testProps} href="/insights/foo/bar">
          Test module link
        </ChromeLink>
      </LinkContext>
    );

    act(() => {
      fireEvent.click(buttton);
    });

    expect(store.getActions()).toEqual([
      {
        type: APP_NAV_CLICK,
        payload: {
          id: 'bar',
          event: {
            id: 'bar',
            navId: 'bar',
            href: '/insights/foo/bar',
          },
        },
      },
    ]);
  });

  test('should not trigger onLinkClick callback', () => {
    const onLinkClickSpy = jest.fn();
    const store = mockStore({
      chrome: {
        activeModule: 'testModule',
        modules: {
          testModule: {},
        },
      },
    });
    const {
      container: { firstElementChild: buttton },
    } = render(
      <LinkContext
        store={store}
        providerValue={{
          onLinkClick: onLinkClickSpy,
        }}
      >
        <ChromeLink {...testProps}>Test module link</ChromeLink>
      </LinkContext>
    );

    act(() => {
      fireEvent.click(buttton);
    });

    expect(onLinkClickSpy).not.toHaveBeenCalled();
  });

  test('should trigger onLinkClick callback', () => {
    const onLinkClickSpy = jest.fn();
    const store = mockStore({
      chrome: {
        activeModule: 'differentModule',
        modules: {
          differentModule: {},
          testModule: {},
        },
      },
    });
    const {
      container: { firstElementChild: buttton },
    } = render(
      <LinkContext
        store={store}
        providerValue={{
          onLinkClick: onLinkClickSpy,
        }}
      >
        <ChromeLink isBeta {...testProps}>
          Test module link
        </ChromeLink>
      </LinkContext>
    );

    act(() => {
      fireEvent.click(buttton);
    });

    expect(onLinkClickSpy).toHaveBeenCalledTimes(1);
  });
});
