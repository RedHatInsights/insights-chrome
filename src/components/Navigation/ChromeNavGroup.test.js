import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import NavContext from './navContext';
import ChromeNavGroup from './ChromeNavGroup';
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

describe('ChromeNavGroup', () => {
  const groupTitle = 'Foo';
  const testProps = {
    appId: 'testModule',
    href: '/foo',
    title: groupTitle,
    navItems: [],
  };

  test('should not render nav item group', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper>
        <ChromeNavGroup isHidden {...testProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(groupTitle)).toHaveLength(0);
  });

  test('should render nav item group', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper>
        <ChromeNavGroup {...testProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(groupTitle)).toHaveLength(1);
  });

  test('should render nav item group with icon', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper>
        <ChromeNavGroup {...testProps} icon="wrench" />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(groupTitle)).toHaveLength(1);
  });

  test('should render nav item group with items', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper>
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
