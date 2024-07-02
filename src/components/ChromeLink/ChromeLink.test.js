/* eslint-disable react/prop-types */
import React from 'react';
import { Provider } from 'react-redux';
import { act, fireEvent, render } from '@testing-library/react';
import createMockStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import ChromeLink from './ChromeLink';
import NavContext from '../Navigation/navContext';

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
        moduleRoutes: [],
      },
    });
    const { getAllByTestId } = render(
      <LinkContext store={store}>
        <ChromeLink {...testProps}>Test module link</ChromeLink>
      </LinkContext>
    );

    expect(getAllByTestId('router-link')).toHaveLength(1);
  });

  test('should not trigger onLinkClick callback', () => {
    const onLinkClickSpy = jest.fn();
    const store = mockStore({
      chrome: {
        moduleRoutes: [],
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

    expect(onLinkClickSpy).toHaveBeenCalledTimes(0);
  });

  test('should not trigger onLinkClick callback on ctrl-click or shift-click', () => {
    const onLinkClickSpy = jest.fn();
    const store = mockStore({
      chrome: {
        moduleRoutes: [],
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
      fireEvent(buttton, new MouseEvent('ctrlKey'));
      fireEvent(buttton, new MouseEvent('shiftKey'));
    });

    expect(onLinkClickSpy).toHaveBeenCalledTimes(0);
  });

  test('should trigger onLinkClick callback', () => {
    const onLinkClickSpy = jest.fn();
    const store = mockStore({
      chrome: {
        moduleRoutes: [],
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
