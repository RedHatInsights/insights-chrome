import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ChromeRoute from '../../../src/components/ChromeRoute';
import { initializeVisibilityFunctions } from '../../../src/utils/VisibilitySingleton';
import { ChromeUser } from '@redhat-cloud-services/types';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { IntlProvider } from 'react-intl';
import ScalprumProvider from '@scalprum/react-core';
import { initialize, removeScalprum } from '@scalprum/core';

const defaultUser: ChromeUser = {
  entitlements: {},
  identity: {
    user: {
      is_org_admin: true,
      is_active: true,
      is_internal: true,
      email: 'foo@redhat.com',
      first_name: 'Joe',
      last_name: 'Doe',
      locale: 'en',
      username: 'jdoe',
    },
    org_id: '1',
    type: 'User',
    account_number: '2',
    internal: {
      org_id: '1',
      account_id: '3',
    },
  },
};

const defaultVisibilityOptions: Parameters<typeof initializeVisibilityFunctions>[0] = {
  getToken: () => Promise.resolve('token'),
  getUser: () => Promise.resolve(defaultUser),
  getUserPermissions: () => Promise.resolve([]),
  isPreview: false,
};

const Wrapper = ({ children, getUser }: React.PropsWithChildren<{ getUser?: () => Promise<ChromeUser> }>) => {
  const [isReady, setIsReady] = useState(false);
  const visibilityOptions: Parameters<typeof initializeVisibilityFunctions>[0] = {
    getToken: defaultVisibilityOptions.getToken,
    getUser: getUser ?? defaultVisibilityOptions.getUser,
    getUserPermissions: defaultVisibilityOptions.getUserPermissions,
    isPreview: defaultVisibilityOptions.isPreview,
  };
  const scalprum = useRef(
    initialize({
      appsConfig: {
        foo: {
          name: 'foo',
          manifestLocation: '/bar/manifest.json',
        },
      },
    })
  );
  useEffect(() => {
    initializeVisibilityFunctions(visibilityOptions);
    // mock the module
    scalprum.current.exposedModules['foo#foo'] = {
      default: () => <div id="foobar">FooBar</div>,
    };

    setIsReady(true);
    return () => {
      removeScalprum();
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <IntlProvider locale="en">
      <ScalprumProvider scalprum={scalprum.current}>
        <Provider store={createStore((state) => state)}>
          <BrowserRouter>
            <Routes>
              <Route path="*" element={children} />
            </Routes>
          </BrowserRouter>
        </Provider>
      </ScalprumProvider>
    </IntlProvider>
  );
};

describe('ChromeRoute', () => {
  it('should render not found route if permissions are not met', () => {
    cy.mount(
      <Wrapper>
        <ChromeRoute module="foo" scope="foo" path="*" permissions={[{ method: 'withEmail', args: ['@nonsense.com'] }] as any} />
      </Wrapper>
    );

    cy.contains('We lost that page').should('be.visible');
  });

  it('should not render page if there is error while checking permissions', () => {
    cy.mount(
      <Wrapper getUser={() => Promise.reject('expected error')}>
        <ChromeRoute module="foo" scope="foo" path="*" permissions={[{ method: 'withEmail', args: ['@redhat.com'] }] as any} />
      </Wrapper>
    );

    cy.contains('We lost that page').should('be.visible');
  });

  it('should render page if permissions are met', () => {
    cy.mount(
      <Wrapper>
        <ChromeRoute module="foo" scope="foo" path="*" permissions={[{ method: 'withEmail', args: ['@redhat.com'] }] as any} />
      </Wrapper>
    );

    cy.contains('FooBar').should('be.visible');
  });

  it('should render route if no permissions are provided', () => {
    cy.mount(
      <Wrapper>
        <ChromeRoute module="foo" scope="foo" path="*" />
      </Wrapper>
    );
    cy.contains('FooBar').should('be.visible');
  });
});
