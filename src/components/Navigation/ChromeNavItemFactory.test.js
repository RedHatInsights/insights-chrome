import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import NavContext from './navContext';
import ChromeNavItemFactory from './ChromeNavItemFactory';
import componentMapper from './componentMapper';

const NavContextWrapper = ({
  providerValue = {
    onLinkClick: jest.fn(),
    componentMapper,
  },
  children,
}) => (
  <MemoryRouter>
    <div>
      <NavContext.Provider value={providerValue}>{children}</NavContext.Provider>
    </div>
  </MemoryRouter>
);

describe('ChromeNavItemFactory', () => {
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

  test('should render chrome nav item', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper>
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
      <NavContextWrapper>
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
      <NavContextWrapper>
        <ChromeNavItemFactory {...groupItemProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(linkTitle)).toHaveLength(0);
    expect(queryAllByText(expandableTitle)).toHaveLength(0);
    expect(queryAllByText(groupTitle)).toHaveLength(1);
  });
});
