/* eslint-disable react/prop-types */
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import createMockStore from 'redux-mock-store';
import NavContext from './navContext';
import ChromeNavGroup from './ChromeNavGroup';
import componentMapper from './componentMapper';

const NavContextWrapper = ({
  store,
  providerValue = {
    onLinkClick: jest.fn(),
    componentMapper,
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

describe('ChromeNavGroup', () => {
  const mockStore = createMockStore();
  const groupTitle = 'Foo';
  const testProps = {
    appId: 'testModule',
    href: '/foo',
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

  test('should not render nav item group', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper store={store}>
        <ChromeNavGroup isHidden {...testProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(groupTitle)).toHaveLength(0);
  });

  test('should render nav item group', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper store={store}>
        <ChromeNavGroup {...testProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(groupTitle)).toHaveLength(1);
  });

  test('should render nav item group with icon', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper store={store}>
        <ChromeNavGroup {...testProps} icon="wrench" />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(groupTitle)).toHaveLength(1);
  });

  test('should render nav item group with items', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper store={store}>
        <ChromeNavGroup
          {...testProps}
          navItems={[
            {
              appId: 'testModule',
              href: '/foo',
              title: 'Sub Item',
            },
          ]}
        />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(groupTitle)).toHaveLength(1);
    expect(queryAllByText('Sub Item')).toHaveLength(1);
  });
});
