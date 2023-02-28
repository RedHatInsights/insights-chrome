import React, { memo, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import GlobalFilter from '../components/GlobalFilter/GlobalFilter';
import { useScalprum } from '@scalprum/react-core';
import { Masthead, MastheadToggle, Page, PageSidebar, PageToggleButton } from '@patternfly/react-core';
import { Header } from '../components/Header/Header';
import Cookie from 'js-cookie';
import isEqual from 'lodash/isEqual';
import { onToggle } from '../redux/actions';
import ChromeRoutes from '../components/Routes/Routes';
import useOuiaTags from '../utils/useOuiaTags';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import BarsIcon from '@patternfly/react-icons/dist/js/icons/bars-icon';
import { useIntl } from 'react-intl';
import messages from '../locales/Messages';
import { CROSS_ACCESS_ACCOUNT_NUMBER } from '../utils/consts';
import { getUrl } from '../utils/common';

import '../components/Navigation/Navigation.scss';
import './DefaultLayout.scss';
import { ReduxState } from '../redux/store';
import useNavigation from '../utils/useNavigation';
import { NavigationProps } from '../components/Navigation';

type ShieldedRootProps = {
  hideNav?: boolean;
  initialized?: boolean;
  Sidebar?: React.FC<NavigationProps>;
  Footer?: React.ReactNode;
};

type DefaultLayoutProps = {
  hasBanner: boolean;
  selectedAccountNumber?: string;
  hideNav: boolean;
  isNavOpen: boolean;
  setIsNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
  Sidebar?: React.FC<NavigationProps>;
  Footer?: React.ReactNode;
};

const DefaultLayout: React.FC<DefaultLayoutProps> = ({ hasBanner, selectedAccountNumber, hideNav, isNavOpen, setIsNavOpen, Sidebar, Footer }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { loaded, schema, noNav } = useNavigation();

  return (
    <Page
      className={classnames({ 'chr-c-page__hasBanner': hasBanner, 'chr-c-page__account-banner': selectedAccountNumber })}
      onPageResize={null} // required to disable PF resize observer that causes re-rendring issue
      header={
        <Masthead className="chr-c-masthead">
          {!hideNav && (
            <MastheadToggle>
              <PageToggleButton
                variant="plain"
                aria-label="Global navigation"
                isNavOpen={isNavOpen}
                onNavToggle={() => {
                  setIsNavOpen((prev) => !prev);
                  dispatch(onToggle());
                }}
              >
                <BarsIcon />
              </PageToggleButton>
            </MastheadToggle>
          )}
          <Header />
        </Masthead>
      }
      sidebar={
        (noNav || hideNav) && Sidebar
          ? undefined
          : Sidebar && <PageSidebar isNavOpen={isNavOpen} id="chr-c-sidebar" nav={<Sidebar schema={schema} loaded={loaded} />} />
      }
    >
      <div className={classnames('chr-render')}>
        <GlobalFilter key={getUrl('bundle')} />
        {selectedAccountNumber && (
          <div className="chr-viewing-as sentry-mask data-hj-suppress">
            {intl.formatMessage(messages.viewingAsAccount, { selectedAccountNumber })}
          </div>
        )}
        <RedirectBanner />
        <ChromeRoutes routesProps={{ scopeClass: 'chr-scope__default-layout' }} />
        {Footer}
      </div>
    </Page>
  );
};

const ShieldedRoot = memo(
  ({ hideNav = false, initialized = false, Sidebar, Footer }: ShieldedRootProps) => {
    const [isMobileView, setIsMobileView] = useState(window.document.body.clientWidth < 1200);
    const [isNavOpen, setIsNavOpen] = useState(!isMobileView);
    /**
     * Required for event listener to access the variables
     */
    const mutableStateRef = useRef({
      isMobileView,
    });
    function navReziseListener() {
      const internalMobile = window.document.body.clientWidth < 1200;
      const { isMobileView } = mutableStateRef.current;
      if (!isMobileView && internalMobile) {
        setIsMobileView(true);
        setIsNavOpen(false);
        mutableStateRef.current = {
          isMobileView: true,
        };
      } else if (isMobileView && !internalMobile) {
        setIsMobileView(false);
        setIsNavOpen(true);
        mutableStateRef.current = {
          isMobileView: false,
        };
      }
    }

    useEffect(() => {
      window.addEventListener('resize', navReziseListener);
      return () => {
        window.removeEventListener('resize', navReziseListener);
      };
    }, []);

    if (!initialized) {
      return null;
    }

    const selectedAccountNumber = Cookie.get(CROSS_ACCESS_ACCOUNT_NUMBER);
    const hasBanner = false; // Update this later when we use feature flags

    return (
      <DefaultLayout
        setIsNavOpen={setIsNavOpen}
        hideNav={hideNav}
        isNavOpen={isNavOpen}
        hasBanner={hasBanner}
        selectedAccountNumber={selectedAccountNumber}
        Sidebar={Sidebar}
        Footer={Footer}
      />
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps)
);

ShieldedRoot.displayName = 'ShieldedRoot';

export type RootAppProps = {
  Sidebar?: React.FC<NavigationProps>;
  Footer?: React.ReactNode;
};

const DefaultLayoutRoot = ({ Sidebar, Footer }: RootAppProps) => {
  const ouiaTags = useOuiaTags();
  const initialized = useScalprum(({ initialized }) => initialized);
  const hideNav = useSelector(({ chrome: { user } }: ReduxState) => !user || !Sidebar);

  return (
    <div id="chrome-app-render-root" {...ouiaTags}>
      <ShieldedRoot hideNav={hideNav} initialized={initialized} Sidebar={Sidebar} Footer={Footer} />
    </div>
  );
};

export default DefaultLayoutRoot;
