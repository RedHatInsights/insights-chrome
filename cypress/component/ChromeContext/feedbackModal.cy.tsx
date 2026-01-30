import React, { Context, createContext, useContext, useState } from 'react';
import { createChromeContext } from '../../../src/chrome/create-chrome';
import { ChromeAPI } from '@redhat-cloud-services/types';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { ChromeAuthContextValue } from '../../../src/auth/ChromeAuthContext';
import { getSharedScope, initSharedScope } from '@scalprum/core';

import Feedback from '../../../src/components/Feedback';
import { IntlProvider } from 'react-intl';
import InternalChromeContext from '../../../src/utils/internalChromeContext';
import { Provider as JotaiProvider } from 'jotai';
import chromeStore from '../../../src/state/chromeStore';
import { BrowserRouter } from 'react-router-dom';

describe('Feedback Modal', () => {
  let chromeContext: Context<ChromeAPI>;
  let contextValue: ChromeAPI;
  const NestedComponen = () => {
    return (
      <BrowserRouter>
        <IntlProvider locale="en">
          <InternalChromeContext.Provider value={{ getEnvironment: () => 'stage' } as any}>
            <Feedback />
          </InternalChromeContext.Provider>
        </IntlProvider>
      </BrowserRouter>
    );
  };
  const InnerComponent = () => {
    const { usePendoFeedback } = useContext(chromeContext);
    usePendoFeedback();
    return null;
  };

  const Wrapper = () => {
    const [removeComponent, setRemoveComponent] = useState(false);
    return (
      <BrowserRouter>
        <IntlProvider locale="en">
          <InternalChromeContext.Provider value={{ getEnvironment: () => 'stage' } as any}>
            <Feedback />
            {!removeComponent ? <InnerComponent /> : null}
            <button onClick={() => setRemoveComponent(true)}>Remove component from dom</button>
          </InternalChromeContext.Provider>
        </IntlProvider>
      </BrowserRouter>
    );
  };

  const CustomButton = () => {
    const { toggleFeedbackModal } = useContext(chromeContext);

    return (
      <button style={{ padding: '5px 10px' }} onClick={() => toggleFeedbackModal(true)}>
        Custom feedback button
      </button>
    );
  };

  const CustomComponent = () => {
    return (
      <BrowserRouter>
        <IntlProvider locale="en">
          <JotaiProvider store={chromeStore}>
            <InternalChromeContext.Provider value={{ getEnvironment: () => 'stage' } as any}>
              <CustomButton />
              <Feedback />
            </InternalChromeContext.Provider>
          </JotaiProvider>
        </IntlProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    initSharedScope();
    const scope = getSharedScope();
    scope['@chrome/visibilityFunctions'] = {
      '*': {
        loaded: 1,
        get: () => {},
      },
    };
    contextValue = createChromeContext({
      analytics: {} as AnalyticsBrowser,
      chromeAuth: {
        getUser: () => Promise.resolve({}),
      } as ChromeAuthContextValue,
      helpTopics: {} as ChromeAPI['helpTopics'],
      quickstartsAPI: {} as ChromeAPI['quickStarts'],
      registerModule: () => {},
      setPageMetadata: () => {},
      useGlobalFilter: () => {},
      isPreview: false,
      addNavListener: () => {},
      deleteNavListener: () => {},
      addWsEventListener: () => {},
    });
    chromeContext = createContext(contextValue);
  });
  it('should test opening and closing feedback modal', () => {
    const Modal = () => {
      return (
        <chromeContext.Provider value={contextValue}>
          <NestedComponen />
        </chromeContext.Provider>
      );
    };
    cy.mount(<Modal />);
    cy.contains('Tell us about your experience').should('not.exist');
    cy.contains('Feedback').click();
    cy.contains('Tell us about your experience').should('exist');
    cy.get('[aria-label="Close"]').click();
    cy.contains('Tell us about your experience').should('not.exist');
  });

  it('should test pendoFeedback', () => {
    const Context = () => {
      return (
        <chromeContext.Provider value={contextValue}>
          <Wrapper />
        </chromeContext.Provider>
      );
    };
    cy.mount(<Context />);
    cy.contains('Tell us about your experience').should('not.exist');
    cy.contains('Feedback').click();
    cy.contains('Tell us about your experience').should('not.exist');
    cy.contains('Remove component from dom').click();
    cy.contains('Feedback').click();
    cy.contains('Tell us about your experience').should('exist');
  });

  it('should use custom feedback button to open feedback modal', () => {
    const CustomModal = () => {
      return (
        <chromeContext.Provider value={contextValue}>
          <CustomComponent />
        </chromeContext.Provider>
      );
    };
    cy.mount(<CustomModal />);
    cy.contains('Tell us about your experience').should('not.exist');
    cy.contains('Custom feedback button').click();
    cy.contains('Tell us about your experience').should('exist');
    cy.get('[aria-label="Close"]').click();
    cy.contains('Tell us about your experience').should('not.exist');
  });
});
