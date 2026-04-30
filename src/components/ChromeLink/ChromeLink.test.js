import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

import ChromeLink from './ChromeLink';
import NavContext from '../Navigation/navContext';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { moduleRoutesAtom } from '../../state/atoms/chromeModuleAtom';
import { activeNavListenersAtom } from '../../state/atoms/activeAppAtom';

const HydrateAtoms = ({ initialValues, children }) => {
  useHydrateAtoms(initialValues);
  return children;
};

const Wrapper = ({ children, atomValues = [], store }) => (
  <MemoryRouter>
    <JotaiProvider store={store}>
      <HydrateAtoms initialValues={atomValues}>
        <NavContext.Provider value={{ onLinkClick: jest.fn() }}>{children}</NavContext.Provider>
      </HydrateAtoms>
    </JotaiProvider>
  </MemoryRouter>
);

describe('ChromeLink', () => {
  const createDefaultStore = () => {
    const store = createStore();
    store.set(activeModuleAtom, 'testModule');
    store.set(moduleRoutesAtom, []);
    return store;
  };

  const defaultAtomValues = [
    [activeModuleAtom, 'testModule'],
    [moduleRoutesAtom, []],
  ];

  test('should render chrome link', () => {
    const store = createDefaultStore();
    const { container } = render(
      <Wrapper atomValues={defaultAtomValues} store={store}>
        <ChromeLink href="/test">Test Link</ChromeLink>
      </Wrapper>
    );
    expect(container).toMatchSnapshot();
  });

  test('should render external chrome link', () => {
    const store = createDefaultStore();
    const { container } = render(
      <Wrapper atomValues={defaultAtomValues} store={store}>
        <ChromeLink href="https://external.com" isExternal>
          External Link
        </ChromeLink>
      </Wrapper>
    );
    expect(container).toMatchSnapshot();
  });

  describe('nav listener triggering', () => {
    test('should trigger nav listeners for same-app navigation', () => {
      const navListenerMock = jest.fn();
      const store = createStore();
      store.set(activeModuleAtom, 'myApp');
      store.set(moduleRoutesAtom, []);
      store.set(activeNavListenersAtom, { 1: navListenerMock });

      const { getByText } = render(
        <Wrapper
          atomValues={[
            [activeModuleAtom, 'myApp'],
            [moduleRoutesAtom, []],
          ]}
          store={store}
        >
          <ChromeLink href="/bundle/myApp/details" appId="myApp">
            Same App Link
          </ChromeLink>
        </Wrapper>
      );

      fireEvent.click(getByText('Same App Link'));
      expect(navListenerMock).toHaveBeenCalledTimes(1);
      expect(navListenerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          navId: 'details',
        })
      );
    });

    test('should NOT trigger nav listeners for cross-app navigation', () => {
      const navListenerMock = jest.fn();
      const store = createStore();
      store.set(activeModuleAtom, 'currentApp');
      store.set(moduleRoutesAtom, []);
      store.set(activeNavListenersAtom, { 1: navListenerMock });

      const { getByText } = render(
        <Wrapper
          atomValues={[
            [activeModuleAtom, 'currentApp'],
            [moduleRoutesAtom, []],
          ]}
          store={store}
        >
          <ChromeLink href="/openshift/migration-advisor/assessments" appId="differentApp">
            Cross App Link
          </ChromeLink>
        </Wrapper>
      );

      fireEvent.click(getByText('Cross App Link'));
      expect(navListenerMock).not.toHaveBeenCalled();
    });

    test('should NOT trigger nav listeners when appId is undefined (e.g. search results)', () => {
      const navListenerMock = jest.fn();
      const store = createStore();
      store.set(activeModuleAtom, 'currentApp');
      store.set(moduleRoutesAtom, []);
      store.set(activeNavListenersAtom, { 1: navListenerMock });

      const { getByText } = render(
        <Wrapper
          atomValues={[
            [activeModuleAtom, 'currentApp'],
            [moduleRoutesAtom, []],
          ]}
          store={store}
        >
          <ChromeLink href="/openshift/migration-advisor/assessments">Search Result Link</ChromeLink>
        </Wrapper>
      );

      fireEvent.click(getByText('Search Result Link'));
      expect(navListenerMock).not.toHaveBeenCalled();
    });

    test('should NOT trigger nav listeners on ctrl+click', () => {
      const navListenerMock = jest.fn();
      const store = createStore();
      store.set(activeModuleAtom, 'myApp');
      store.set(moduleRoutesAtom, []);
      store.set(activeNavListenersAtom, { 1: navListenerMock });

      const { getByText } = render(
        <Wrapper
          atomValues={[
            [activeModuleAtom, 'myApp'],
            [moduleRoutesAtom, []],
          ]}
          store={store}
        >
          <ChromeLink href="/bundle/myApp/details" appId="myApp">
            Ctrl Click Link
          </ChromeLink>
        </Wrapper>
      );

      fireEvent.click(getByText('Ctrl Click Link'), { ctrlKey: true });
      expect(navListenerMock).not.toHaveBeenCalled();
    });
  });
});
