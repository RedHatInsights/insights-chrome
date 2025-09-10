import { getSharedScope } from '@scalprum/core';
import ScalprumProvider from '@scalprum/react-core';
import React, { ComponentType, PropsWithChildren, Suspense, lazy, useEffect, useState } from 'react';
import updateSharedScope, { hacApps } from '../../../src/chrome/update-shared-scope';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

const PatchedLink = lazy<ComponentType<PropsWithChildren<{ to: string }>>>(async () => {
  const m = await getSharedScope()['react-router-dom']['*'].get();
  return {
    default: m().NavLink,
  };
});

const ScalprumBase = ({ children }: PropsWithChildren) => {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    updateSharedScope();
    setTimeout(() => {
      // delay the render to ensure the shared scope was patched
      setOk(true);
    });
  }, []);
  return <ScalprumProvider config={{}}>{ok && <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>}</ScalprumProvider>;
};

describe('RouterOverrides', () => {
  const cases = [
    ...hacApps.map((app) => ({
      name: `Should prefix hacApp link pathname with /hac for ${app}`,
      pathname: `/foo/hac${app}`,
      hasPrefix: true,
    })),
    {
      name: 'Should not prefix hacApp link pathname with "hac" substring somewhere in the pathname',
      pathname: '/foo/hac-e2e-user/application/bar',
      hasPrefix: false,
    },
  ];

  cases.forEach(({ name, pathname, hasPrefix }) => {
    it(name, () => {
      cy.mount(
        <BrowserRouter>
          <div>
            <Link to={pathname}>navigate</Link>
          </div>
          <ScalprumBase>
            <Routes>
              <Route path={pathname} element={<PatchedLink to="/application-pipeline/workspaces">trigger</PatchedLink>} />
            </Routes>
          </ScalprumBase>
        </BrowserRouter>
      );

      cy.contains('navigate').click();
      cy.contains('trigger')
        .first()
        .invoke('attr', 'href')
        .should('eq', `${hasPrefix ? '/hac' : ''}/application-pipeline/workspaces`);
    });
  });
});
