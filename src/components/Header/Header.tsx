import React, { Fragment, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Tools from './Tools';
import UnAuthtedHeader from './UnAuthtedHeader';
import { MastheadBrand, MastheadContent, MastheadMain, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import SatelliteLink from './SatelliteLink';
import ContextSwitcher from '../ContextSwitcher';
import Feedback from '../Feedback';
import Activation from '../Activation';
import { useSelector } from 'react-redux';
import Logo from './Logo';
import ChromeLink from '../ChromeLink';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ChromeUser } from '@redhat-cloud-services/types';
import { DeepRequired } from 'utility-types';

import './Header.scss';
import { ReduxState } from '../../redux/store';
import { activationRequestURLs } from '../../utils/consts';
import { ITLess } from '../../utils/common';
import SearchInput from '../Search/SearchInput';
import AllServicesDropdown from '../AllServicesDropdown/AllServicesDropdown';
import Breadcrumbs, { Breadcrumbsprops } from '../Breadcrumbs/Breadcrumbs';
import { entries } from 'lodash';

const FeedbackRoute = ({ user }: { user: DeepRequired<ChromeUser> }) => {
  const paths =
    localStorage.getItem('chrome:experimental:feedback') === 'true'
      ? ['*']
      : ['insights/*', 'settings/*', 'openshift/*', 'application-services/*', 'ansible/*', 'edge/*'];
  return (
    <Routes>
      {paths.map((path) => (
        <Route key={path} path={path} element={<Feedback user={user} />} />
      ))}
    </Routes>
  );
};

export const Header = ({ breadcrumbsProps }: { breadcrumbsProps?: Breadcrumbsprops }) => {
  const user = useSelector(({ chrome }: DeepRequired<ReduxState>) => chrome.user);
  const search = new URLSearchParams(window.location.search).keys().next().value;
  const isActivationPath = activationRequestURLs.includes(search);
  const isITLessEnv = ITLess();
  const { pathname } = useLocation();
  const noBreadcrumb = !['/', '/allservices', '/favoritedservices'].includes(pathname);

  const elementRef1 = useRef<HTMLDivElement>(null);
  const elementRef2 = useRef<HTMLDivElement>(null);
  const [isElement1Visible, setIsElement1Visible] = useState(false);
  const [isElement2Visible, setIsElement2Visible] = useState(false);
  const [element1Parent, setElement1Parent] = useState<Element | null>(null);
  const [element2Parent, setElement2Parent] = useState<Element | null>(null);

  const resizeOperator = () => {
    console.log(window.innerWidth);
    const windowWidth = window.innerWidth;
    if (windowWidth >= 1450) {
        setIsElement1Visible(false);
        setIsElement2Visible(true);
    } else {
        setIsElement1Visible(true);
        setIsElement2Visible(false);
    }
  }

  useEffect(() => {
    setElement1Parent(elementRef1.current!.parentElement);
    setElement2Parent(elementRef2.current!.parentElement);
    resizeOperator();
    window.addEventListener('resize', resizeOperator);
  }, []);

  useEffect (() => {
    console.log("element 1 changed")
    if (isElement1Visible && element1Parent) {
      console.log("element 1 add")
      element1Parent.appendChild(elementRef1.current!);
    } else {
      console.log("element 1 remove")
      elementRef1.current?.parentElement?.removeChild(elementRef1.current);
    }
  }, [isElement1Visible])

  useEffect (() => {
    console.log("element 2 changed")
    if (isElement2Visible && element2Parent) {
      console.log("element 2 add")
      element2Parent.appendChild(elementRef2.current!);
    } else {
      console.log("element 2 remove")
      elementRef2.current?.parentElement?.removeChild(elementRef2.current);
    }
  }, [isElement2Visible])

  return (
    <Fragment>
      <MastheadMain className="pf-u-pl-lg pf-u-pt-0 pf-u-pb-xs">
        <MastheadBrand className="pf-u-flex-shrink-0 pf-u-mr-lg" component={(props) => <ChromeLink {...props} appId="landing" href="/" />}>
          <Logo />
        </MastheadBrand>
        <Toolbar isFullHeight style={{ display: 'flex', justifyContent: 'end' }}>
          <ToolbarContent>
            <div>
                <div ref={ elementRef1 }>
                  <ToolbarGroup
                    alignment={{ default: 'alignRight' }}
                    className="pf-m-icon-button-group"
                    widget-type="InsightsToolbar"
                    visibility={{ '2xl': 'hidden' }}
                  >
                    <HeaderTools />
                  </ToolbarGroup>
              </div>
            </div>
          </ToolbarContent>
        </Toolbar>
      </MastheadMain>
      <MastheadContent className="pf-u-mx-md pf-u-mx-0-on-2xl">
        {user?.identity?.account_number && !isITLessEnv && ReactDOM.createPortal(<FeedbackRoute user={user} />, document.body)}
        {user && isActivationPath && <Activation user={user} request={search} />}
        <Toolbar isFullHeight>
          <ToolbarContent>
            <ToolbarGroup variant="filter-group">
              {user && (
                <ToolbarItem>
                  <AllServicesDropdown />
                  {isITLessEnv && user?.identity?.user?.is_org_admin && <SatelliteLink />}
                </ToolbarItem>
              )}
              {user && !isITLessEnv && (
                <ToolbarItem className="pf-m-hidden pf-m-visible-on-xl">
                  <ContextSwitcher user={user} className="data-hj-suppress sentry-mask" />
                </ToolbarItem>
              )}
            </ToolbarGroup>
            <ToolbarGroup className="pf-u-flex-grow-1 pf-u-mr-0 pf-u-mr-md-on-2xl" variant="filter-group">
              <SearchInput />
            </ToolbarGroup>
            <div>
              <div ref={ elementRef2 }>
                <ToolbarGroup
                  className="pf-m-icon-button-group pf-u-ml-auto"
                  visibility={{ default: 'hidden', '2xl': 'visible' }}
                  widget-type="InsightsToolbar"
                >  
                  <HeaderTools />   
                </ToolbarGroup>
              </div>
            </div>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
      {noBreadcrumb && (
        <ToolbarGroup className="chr-c-breadcrumbs__group">
          <Breadcrumbs {...breadcrumbsProps} />
        </ToolbarGroup>
      )}
    </Fragment>
  );
};

export const HeaderTools = () => {
  const user = useSelector(({ chrome }: ReduxState) => chrome?.user);
  if (!user) {
    return <UnAuthtedHeader />;
  }
  return <Tools />;
};
