/* eslint-disable react/prop-types */
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import createMockStore from 'redux-mock-store';
import NavContext from './navContext';
import ChromeNavItemFactory from './ChromeNavItemFactory';
import componentMapper from './componentMapper';

const NavContextWrapper = ({
  store,
  providerValue = {
    onLinkClick: jest.fn(),
    componentMapper,
  },
  children,
}) => (
  <MemoryRouter>
    <Provider store={store}>
      <NavContext.Provider value={providerValue}>{children}</NavContext.Provider>
    </Provider>
  </MemoryRouter>
);

describe('ChromeNavItemFactory', () => {
  const mockStore = createMockStore();
  const linkTitle = 'Foo';
  const expandableTitle = 'bar';
  const groupTitle = 'group';
  const itemProps = {
    appId: 'testModule',
    href: '/foo',
    title: linkTitle,
  };
  const expandableItemProps = {
    appId: 'testModule',
    href: '/foo',
    id: 'test-id',
    title: expandableTitle,
    expandable: true,
    routes: [itemProps],
  };
  const groupItemProps = {
    groupId: 'group',
    title: groupTitle,
    navItems: [],
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

  test('should render chrome nav item', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper store={store}>
        <ChromeNavItemFactory {...itemProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(linkTitle)).toHaveLength(1);
    expect(queryAllByText(expandableTitle)).toHaveLength(0);
    expect(queryAllByText(groupTitle)).toHaveLength(0);
  });

  test('should render chrome expandable nav item', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper store={store}>
        <ChromeNavItemFactory {...expandableItemProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(linkTitle)).toHaveLength(1);
    expect(queryAllByText(expandableTitle)).toHaveLength(1);
    expect(queryAllByText(groupTitle)).toHaveLength(0);
  });

  test('should render chrome group nav item', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper store={store}>
        <ChromeNavItemFactory {...groupItemProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(linkTitle)).toHaveLength(0);
    expect(queryAllByText(expandableTitle)).toHaveLength(0);
    expect(queryAllByText(groupTitle)).toHaveLength(1);
  });
});
