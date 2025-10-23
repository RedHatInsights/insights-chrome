import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import NavContext from './navContext';
import ChromeNavItem from './ChromeNavItem';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';
import { activeProductAtom } from '../../state/atoms/activeProductAtom';

const HydrateAtoms = ({ initialValues, children }) => {
  useHydrateAtoms(initialValues);
  return children;
};

const NavContextWrapper = ({
  providerValue = {
    onLinkClick: jest.fn(),
  },
  children,
  initialEntries,
  atomValues = [],
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    <JotaiProvider>
      <HydrateAtoms initialValues={atomValues}>
        <NavContext.Provider value={providerValue}>{children}</NavContext.Provider>
      </HydrateAtoms>
    </JotaiProvider>
  </MemoryRouter>
);

describe('ChromeNavItem', () => {
  const linkTitle = 'Foo';
  const testProps = {
    appId: 'testModule',
    href: '/foo',
    title: linkTitle,
  };
  const defaultAtomValues = [
    [isPreviewAtom, false],
    [activeProductAtom, null],
  ];

  test('should not render nav item', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper atomValues={defaultAtomValues}>
        <ChromeNavItem isHidden {...testProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText(linkTitle)).toHaveLength(0);
  });

  test('should render nav item', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper atomValues={defaultAtomValues}>
        <ChromeNavItem {...testProps} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText('beta')).toHaveLength(0);
    expect(queryAllByText(linkTitle)).toHaveLength(1);
  });

  test('should render nav item with an external icon', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper atomValues={defaultAtomValues}>
        <ChromeNavItem {...testProps} isExternal />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText('beta')).toHaveLength(0);
    expect(queryAllByText(linkTitle)).toHaveLength(1);
  });

  test('should render nav item with a node title', () => {
    const { queryAllByText, container } = render(
      <NavContextWrapper atomValues={defaultAtomValues}>
        <ChromeNavItem {...testProps} title={<span data-testid="test-span">Node title</span>} />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(queryAllByText('beta')).toHaveLength(0);
    expect(queryAllByText('Node title')).toHaveLength(1);
  });

  test('should render nav item with beta badge', () => {
    const { container } = render(
      <NavContextWrapper atomValues={defaultAtomValues}>
        <ChromeNavItem {...testProps} isBeta />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
  });
});
