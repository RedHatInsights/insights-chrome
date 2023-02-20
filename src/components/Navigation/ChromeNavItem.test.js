/* eslint-disable react/prop-types */
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import createMockStore from 'redux-mock-store';
import NavContext from './navContext';
import ChromeNavItem from './ChromeNavItem';

const NavContextWrapper = ({
  store,
  providerValue = {
    onLinkClick: jest.fn(),
  },
  children,
  initialEntries,
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    <Provider store={store}>
      <NavContext.Provider value={providerValue}>{children}</NavContext.Provider>
    </Provider>
  </MemoryRouter>
);

describe('ChromeNavItem', () => {
  const mockStore = createMockStore();
  const linkTitle = 'Foo';
  const testProps = {
    appId: 'testModule',
    href: '/foo',
    title: linkTitle,
  };
  const store = mockStore({
    chrome: {
      activeModule: 'testModule',
      moduleRoutes: [],
      modules: {
        testModule: {},
      },
    },
  });

  test('should not render nav item', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper store={store}>
        <ChromeNavItem isHidden {...testProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(linkTitle)).toHaveLength(0);
  });

  test('should render nav item', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper store={store}>
        <ChromeNavItem {...testProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText('beta')).toHaveLength(0);
    expect(queryAllByText(linkTitle)).toHaveLength(1);
  });

  test('should render nav item with an external icon', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper store={store}>
        <ChromeNavItem {...testProps} isExternal />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText('beta')).toHaveLength(0);
    expect(queryAllByText(linkTitle)).toHaveLength(1);
  });

  test('should render nav item with a node title', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper store={store}>
        <ChromeNavItem {...testProps} title={<span data-testid="test-span">Node title</span>} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText('beta')).toHaveLength(0);
    expect(queryAllByText('Node title')).toHaveLength(1);
  });

  test('should render nav item with beta badge', () => {
    const { container } = render(
      <NavContextWrapper store={store}>
        <ChromeNavItem {...testProps} isBeta />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
  });
});
