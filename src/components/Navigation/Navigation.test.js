import React from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import { act, render } from '@testing-library/react';
import { useHydrateAtoms } from 'jotai/utils';
import Navigation from './';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';

jest.mock('@unleash/proxy-client-react', () => {
  const actual = jest.requireActual('@unleash/proxy-client-react');
  return {
    __esModule: true,
    ...actual,
    // unblock navigation loading
    useFlag: () => false,
    useFlagsStatus: () => ({ flagsReady: true }),
  };
});

const HydrateAtoms = ({ initialValues, children }) => {
  useHydrateAtoms(initialValues);
  return children;
};

const NavContextWrapper = ({ initialValues, children, initialEntries = ['/insights/dashboard'] }) => (
  <MemoryRouter initialEntries={initialEntries}>
    <JotaiProvider>
      <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
    </JotaiProvider>
  </MemoryRouter>
);

describe('ChromeNavItem', () => {
  const navTitle = 'Nav title';
  const defaultAtomValues = [[isPreviewAtom, false]];

  test('should render navigation loader if schema was not loaded', () => {
    const { container } = render(
      <NavContextWrapper initialValues={defaultAtomValues}>
        <Navigation />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(container.querySelectorAll('.chr-c-app-switcher--loading')).toHaveLength(1);
    expect(container.querySelectorAll('.chr-c-app-title')).toHaveLength(0);
  });

  test('should render navigation ', async () => {
    let container;
    await act(async () => {
      const { container: iContainer } = render(
        <NavContextWrapper initialValues={defaultAtomValues}>
          <Navigation loaded schema={{ navItems: [], title: navTitle }} />
        </NavContextWrapper>
      );
      container = iContainer;
    });
    expect(container).toMatchSnapshot();
    expect(container.querySelectorAll('.chr-c-app-switcher--loading')).toHaveLength(0);
    expect(container.querySelectorAll('.chr-c-app-title')).toHaveLength(1);
    expect(container.querySelector('.chr-c-app-title').textContent).toEqual(navTitle);
  });
});
