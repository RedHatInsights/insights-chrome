import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import NavContext from './navContext';
import ChromeNavExpandable from './ChromeNavExpandable';
import componentMapper from './componentMapper';

const NavContextWrapper = ({
  providerValue = {
    onLinkClick: jest.fn(),
    componentMapper,
  },
  children,
  initialEntries,
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    <div>
      <NavContext.Provider value={providerValue}>{children}</NavContext.Provider>
    </div>
  </MemoryRouter>
);

describe('ChromeNavExpandable', () => {
  const expandableTitle = 'Foo';
  const testProps = {
    appId: 'testModule',
    href: '/foo',
    title: expandableTitle,
    routes: [{ appId: 'bar', title: 'title', href: '/foo/bar' }],
    id: 'test-id',
  };

  test('should not render nav item expandable', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper>
        <ChromeNavExpandable isHidden {...testProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(expandableTitle)).toHaveLength(0);
  });

  test('should render nav item expandable', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper>
        <ChromeNavExpandable {...testProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(expandableTitle)).toHaveLength(1);
  });

  test('should render nav item expandable with items', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper>
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
