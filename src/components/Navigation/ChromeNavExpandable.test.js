import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import createMockStore from 'redux-mock-store';
import NavContext from './navContext';
import ChromeNavExpandable from './ChromeNavExpandable';
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

describe('ChromeNavExpandable', () => {
  const mockStore = createMockStore();
  const expandableTitle = 'Foo';
  const testProps = {
    appId: 'testModule',
    href: '/foo',
    title: expandableTitle,
    routes: [{ appId: 'bar', title: 'title', href: '/foo/bar' }],
    id: 'test-id',
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

  test('should not render nav item expandable', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper store={store}>
        <ChromeNavExpandable isHidden {...testProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(expandableTitle)).toHaveLength(0);
  });

  test('should render nav item expandable', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper store={store}>
        <ChromeNavExpandable {...testProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(expandableTitle)).toHaveLength(1);
  });

  test('should render nav item expandable with items', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper store={store}>
        <ChromeNavExpandable
          {...testProps}
          routes={[
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
    expect(queryAllByText(expandableTitle)).toHaveLength(1);
    expect(queryAllByText('Sub Item')).toHaveLength(1);
  });
});
