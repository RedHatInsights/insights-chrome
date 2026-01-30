import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

import ChromeLink from './ChromeLink';
import NavContext from '../Navigation/navContext';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { moduleRoutesAtom } from '../../state/atoms/chromeModuleAtom';
import { triggerNavListenersAtom } from '../../state/atoms/activeAppAtom';

const HydrateAtoms = ({ initialValues, children }) => {
  useHydrateAtoms(initialValues);
  return children;
};

const Wrapper = ({ children, atomValues = [] }) => (
  <MemoryRouter>
    <JotaiProvider>
      <HydrateAtoms initialValues={atomValues}>
        <NavContext.Provider value={{ onLinkClick: jest.fn() }}>{children}</NavContext.Provider>
      </HydrateAtoms>
    </JotaiProvider>
  </MemoryRouter>
);

describe('ChromeLink', () => {
  const defaultAtomValues = [
    [activeModuleAtom, 'testModule'],
    [moduleRoutesAtom, []],
    [triggerNavListenersAtom, jest.fn()],
  ];

  test('should render chrome link', () => {
    const { container } = render(
      <Wrapper atomValues={defaultAtomValues}>
        <ChromeLink href="/test">Test Link</ChromeLink>
      </Wrapper>
    );
    expect(container).toMatchSnapshot();
  });

  test('should render external chrome link', () => {
    const { container } = render(
      <Wrapper atomValues={defaultAtomValues}>
        <ChromeLink href="https://external.com" isExternal>
          External Link
        </ChromeLink>
      </Wrapper>
    );
    expect(container).toMatchSnapshot();
  });
});
