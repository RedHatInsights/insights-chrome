import React, { memo, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Divider, DropdownItem, Switch, ToolbarItem } from '@patternfly/react-core';
import QuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/question-circle-icon';
import CogIcon from '@patternfly/react-icons/dist/js/icons/cog-icon';
import RedhatIcon from '@patternfly/react-icons/dist/js/icons/redhat-icon';
import UserToggle from './UserToggle';
import ToolbarToggle, { ToolbarToggleDropdownItem } from './ToolbarToggle';
import HeaderAlert from './HeaderAlert';
import { useSelector } from 'react-redux';
import cookie from 'js-cookie';
import { ITLess, getRouterBasename, getSection, isBeta } from '../../utils/common';
import { useIntl } from 'react-intl';
import { useFlag } from '@unleash/proxy-client-react';
import messages from '../../locales/Messages';
import { createSupportCase } from '../../utils/createCase';
import LibtJWTContext from '../LibJWTContext';
import { ReduxState } from '../../redux/store';

const isITLessEnv = ITLess();

export const switchRelease = (isBeta: boolean, pathname: string) => {
  cookie.set('cs_toggledRelease', 'true');
  const previewFragment = getRouterBasename(pathname);

  if (isBeta) {
    return pathname.replace(previewFragment.includes('beta') ? /\/beta/ : /\/preview/, '');
  } else {
    const path = pathname.split('/');
    // awlays go to beta as a default
    path[0] = 'beta';
    return `/beta${pathname}`;
  }
};

const InternalButton = () => (
  <Button
    variant="plain"
    aria-label="Go to internal tools"
    widget-type="InternalButton"
    className="chr-c-toolbar__button-internal"
    href={`${document.baseURI}internal`}
    component="a"
  >
    <RedhatIcon />
  </Button>
);

type SettingsButtonProps = {
  settingsMenuDropdownItems: ToolbarToggleDropdownItem[];
};

const SettingsButton = ({ settingsMenuDropdownItems }: SettingsButtonProps) => (
  <ToolbarToggle
    key="Settings menu"
    icon={() => <CogIcon />}
    id="SettingsMenu"
    ariaLabel="Settings menu"
    ouiaId="chrome-settings"
    hasToggleIndicator={null}
    widget-type="SettingsMenu"
    dropdownItems={settingsMenuDropdownItems}
  />
);

const Tools = () => {
  const [{ isDemoAcc, isInternal, isRhosakEntitled }, setState] = useState({
    isInternal: true,
    isRhosakEntitled: false,
    isDemoAcc: false,
  });
  const user = useSelector(({ chrome: { user } }: ReduxState) => user!);
  const libjwt = useContext(LibtJWTContext);
  const intl = useIntl();
  const location = useLocation();
  const settingsPath = `/settings/sources`;
  const identityAndAccessManagmentPath = '/iam/user-access/users';
  const betaSwitcherTitle = `${isBeta() ? intl.formatMessage(messages.stopUsing) : intl.formatMessage(messages.use)} ${intl.formatMessage(
    messages.betaRelease
  )}`;

  const enableAuthDropdownOption = useFlag('platform.chrome.dropdown.authfactor');

  /* list out the items for the settings menu */
  const settingsMenuDropdownItems = [
    {
      url: settingsPath,
      title: 'Settings',
      target: '_self',
      appId: 'sources',
    },
    ...(enableAuthDropdownOption
      ? [
          {
            url: identityAndAccessManagmentPath,
            title: 'Identity & Access Management',
            target: '_self',
            appId: 'iam',
          },
        ]
      : []),
  ];

  useEffect(() => {
    if (user) {
      setState({
        isInternal: !!user?.identity?.user?.is_internal,
        isRhosakEntitled: !!user?.entitlements?.rhosak?.is_entitled,
        isDemoAcc: user?.identity?.user?.username === 'insights-demo-2021',
      });
    }
  }, [user]);

  /* list out the items for the about menu */
  const aboutMenuDropdownItems = [
    {
      title: `${intl.formatMessage(messages.apiDocumentation)}`,
      url: `/docs/api`,
      appId: 'apiDocs',
    },
    {
      title: `${intl.formatMessage(messages.openSupportCase)}`,
      onClick: () => createSupportCase(user.identity, libjwt),
      isDisabled: window.location.href.includes('/application-services') && !isRhosakEntitled,
      isHidden: isITLessEnv,
    },
    {
      title: `${intl.formatMessage(messages.statusPage)}`,
      url: 'https://status.redhat.com/',
      isHidden: isITLessEnv,
    },
    {
      title: `${intl.formatMessage(messages.supportOptions)}`,
      url: 'https://access.redhat.com/support',
      isHidden: isITLessEnv,
    },
    {
      title: `${intl.formatMessage(messages.insightsRhelDocumentation)}`,
      url: `https://access.redhat.com/documentation/en-us/red_hat_insights`,
      isHidden: getSection() !== 'insights' || isITLessEnv,
    },

    {
      title: `${intl.formatMessage(messages.demoMode)}`,
      onClick: () => cookie.set('cs_demo', 'true') && window.location.reload(),
      isHidden: !isDemoAcc,
    },
  ];

  /* Combine aboutMenuItems with a settings link on mobile */
  const mobileDropdownItems = [
    { title: 'separator' },
    {
      url: settingsPath,
      title: 'Settings',
      target: '_self',
    },
    {
      title: betaSwitcherTitle,
      onClick: () => (window.location.href = switchRelease(isBeta(), location.pathname)),
    },
    { title: 'separator' },
    ...aboutMenuDropdownItems,
  ];

  /* QuestionMark icon that should be used for "help/support" things */
  const AboutButton = () => (
    <ToolbarToggle
      key="Help menu"
      icon={QuestionCircleIcon}
      id="HelpMenu"
      ouiaId="chrome-help"
      ariaLabel="Help menu"
      hasToggleIndicator={null}
      dropdownItems={aboutMenuDropdownItems}
    />
  );

  const BetaSwitcher = () => {
    return (
      <Switch
        id="reversed-switch"
        label="Beta on"
        labelOff="Beta off"
        aria-label="Beta switcher"
        isChecked={isBeta()}
        onChange={() => (window.location.href = switchRelease(isBeta(), location.pathname))}
        isReversed
        className="chr-c-beta-switcher"
      />
    );
  };

  const ThemeToggle = () => {
    const [darkmode, setDarkmode] = useState(false);
    return (
      <Switch
        id="no-label-switch-on"
        isChecked={darkmode || false}
        aria-label="Dark mode switch"
        onChange={() => {
          setDarkmode(!darkmode);
          document.body.classList.contains('pf-theme-dark')
            ? document.body.classList.remove('pf-theme-dark')
            : document.body.classList.add('pf-theme-dark');
        }}
      />
    );
  };

  return (
    <>
      <ToolbarItem>
        <BetaSwitcher />
      </ToolbarItem>
      {localStorage.getItem('chrome:darkmode') === 'true' && (
        <ToolbarItem>
          <ThemeToggle />
        </ToolbarItem>
      )}
      {isInternal && <ToolbarItem>{<InternalButton />}</ToolbarItem>}
      <ToolbarItem visibility={{ default: 'hidden', md: 'visible' }}>
        {<SettingsButton settingsMenuDropdownItems={settingsMenuDropdownItems} />}
      </ToolbarItem>
      <ToolbarItem visibility={{ default: 'hidden', md: 'visible' }}>
        <AboutButton />
      </ToolbarItem>
      <ToolbarItem visibility={{ default: 'hidden', lg: 'visible' }}>
        <UserToggle />
      </ToolbarItem>
      {/* Collapse tools and user dropdown to kebab on small screens  */}

      <ToolbarItem visibility={{ lg: 'hidden' }}>
        <UserToggle
          isSmall
          extraItems={mobileDropdownItems.map((action, key) => (
            <React.Fragment key={key}>
              {action.title === 'separator' ? (
                <Divider component="li" />
              ) : (
                <DropdownItem
                  {...(action.onClick
                    ? {
                        component: 'button',
                        onClick: action.onClick,
                      }
                    : {
                        href: action.url,
                        component: 'a',
                        target: '_blank',
                        rel: 'noopener noreferrer',
                      })}
                >
                  {action.title}
                </DropdownItem>
              )}
            </React.Fragment>
          ))}
        />
      </ToolbarItem>
      {cookie.get('cs_toggledRelease') === 'true' ? (
        <HeaderAlert
          title={`You're ${isBeta() ? 'now' : 'no longer'} using the preview release.`}
          onDismiss={() => cookie.set('cs_toggledRelease', 'false')}
        />
      ) : null}
    </>
  );
};

export default memo(Tools);
