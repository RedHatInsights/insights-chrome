/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { memo, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AlertActionLink,
  AlertVariant,
  Button,
  Divider,
  DropdownItem,
  NotificationBadge,
  Switch,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core';
import QuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/question-circle-icon';
import CogIcon from '@patternfly/react-icons/dist/js/icons/cog-icon';
import RedhatIcon from '@patternfly/react-icons/dist/js/icons/redhat-icon';
import UserToggle from './UserToggle';
import ToolbarToggle, { ToolbarToggleDropdownItem } from './ToolbarToggle';
import HeaderAlert from './HeaderAlert';
import { useDispatch, useSelector } from 'react-redux';
import cookie from 'js-cookie';
import { ITLess, getRouterBasename, getSection, isBeta } from '../../utils/common';
import { useIntl } from 'react-intl';
import { useFlag } from '@unleash/proxy-client-react';
import messages from '../../locales/Messages';
import { createSupportCase } from '../../utils/createCase';
import LibtJWTContext from '../LibJWTContext';
import { ReduxState } from '../../redux/store';
import BellIcon from '@patternfly/react-icons/dist/esm/icons/bell-icon';
import { toggleNotificationsDrawer } from '../../redux/actions';
import useWindowWidth from '../../hooks/useWindowWidth';

const isITLessEnv = ITLess();

export const switchRelease = (isBeta: boolean, pathname: string, previewEnabled: boolean) => {
  cookie.set('cs_toggledRelease', 'true');
  const previewFragment = getRouterBasename(pathname);

  if (isBeta) {
    return pathname.replace(previewFragment.includes('beta') ? /\/beta/ : /\/preview/, '');
  } else {
    return previewEnabled ? `/preview${pathname}` : `/beta${pathname}`;
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
  <Tooltip aria="none" aria-live="polite" content={'Settings'} flipBehavior={['bottom']} className="tooltip-inner-settings-cy">
    <ToolbarToggle
      key="Settings menu"
      icon={() => <CogIcon />}
      id="SettingsMenu"
      ariaLabel="Settings menu"
      ouiaId="chrome-settings"
      hasToggleIndicator={null}
      widget-type="SettingsMenu"
      dropdownItems={settingsMenuDropdownItems}
      className="tooltip-button-settings-cy"
    />
  </Tooltip>
);

const Tools = () => {
  const [{ isDemoAcc, isInternal, isRhosakEntitled }, setState] = useState({
    isInternal: true,
    isRhosakEntitled: false,
    isDemoAcc: false,
  });
  const { xs } = useWindowWidth();
  const user = useSelector(({ chrome: { user } }: ReduxState) => user!);
  const unreadNotifications = useSelector(({ chrome: { notifications } }: ReduxState) => notifications?.data?.filter((isRead) => isRead) || []);
  const isDrawerExpanded = useSelector(({ chrome: { notifications } }: ReduxState) => notifications?.isExpanded);
  const dispatch = useDispatch();
  const libjwt = useContext(LibtJWTContext);
  const intl = useIntl();
  const location = useLocation();
  const settingsPath = `/settings/sources`;
  const identityAndAccessManagmentPath = '/iam/user-access/users';
  const betaSwitcherTitle = `${isBeta() ? intl.formatMessage(messages.stopUsing) : intl.formatMessage(messages.use)} ${intl.formatMessage(
    messages.betaRelease
  )}`;

  const enableAuthDropdownOption = useFlag('platform.chrome.dropdown.authfactor');
  const previewEnabled = useFlag('platform.chrome.preview');
  const isNotificationsEnabled = useFlag('platform.chrome.notifications-drawer');

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
      url: `https://developers.redhat.com/api-catalog/`,
      isHidden: isITLessEnv,
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
      onClick: () => (window.location.href = switchRelease(isBeta(), location.pathname, previewEnabled)),
    },
    { title: 'separator' },
    ...aboutMenuDropdownItems,
  ];

  /* QuestionMark icon that should be used for "help/support" things */
  const AboutButton = () => (
    <Tooltip aria="none" aria-live="polite" content={'Help'} flipBehavior={['bottom']} className="tooltip-inner-help-cy">
      <ToolbarToggle
        key="Help menu"
        icon={QuestionCircleIcon}
        id="HelpMenu"
        ouiaId="chrome-help"
        ariaLabel="Help menu"
        hasToggleIndicator={null}
        dropdownItems={aboutMenuDropdownItems}
        className="tooltip-button-help-cy"
      />
    </Tooltip>
  );

  const BetaSwitcher = () => {
    return (
      <Switch
        id="reversed-switch"
        label="Preview on"
        labelOff="Preview off"
        aria-label="Preview switcher"
        isChecked={isBeta()}
        onChange={() => (window.location.href = switchRelease(isBeta(), location.pathname, previewEnabled))}
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
      <ToolbarItem
        className="pf-v5-u-mr-0"
        {...(isNotificationsEnabled && {
          spacer: {
            default: 'spacerMd',
          },
        })}
      >
        {!xs && <BetaSwitcher />}
      </ToolbarItem>
      {isNotificationsEnabled && (
        <ToolbarItem>
          <NotificationBadge
            className="chr-c-notification-badge"
            variant={unreadNotifications.length === 0 ? 'read' : 'unread'}
            onClick={() => dispatch(toggleNotificationsDrawer())}
            aria-label="Notifications"
            isExpanded={isDrawerExpanded}
          >
            <BellIcon />
          </NotificationBadge>
        </ToolbarItem>
      )}
      {localStorage.getItem('chrome:darkmode') === 'true' && (
        <ToolbarItem>
          <ThemeToggle />
        </ToolbarItem>
      )}
      {isInternal && (
        <ToolbarItem className="pf-v5-u-mr-0">
          <Tooltip aria="none" aria-live="polite" content={'Internal'} flipBehavior={['bottom']}>
            <InternalButton />
          </Tooltip>
        </ToolbarItem>
      )}
      <ToolbarItem className="pf-v5-u-mr-0" visibility={{ default: 'hidden', md: 'visible' }}>
        {<SettingsButton settingsMenuDropdownItems={settingsMenuDropdownItems} />}
      </ToolbarItem>
      <ToolbarItem className="pf-v5-u-mr-0" visibility={{ default: 'hidden', md: 'visible' }}>
        <AboutButton />
      </ToolbarItem>
      <ToolbarItem className="pf-v5-u-mr-0" visibility={{ default: 'hidden', lg: 'visible' }}>
        <UserToggle />
      </ToolbarItem>
      {/* Collapse tools and user dropdown to kebab on small screens  */}

      <ToolbarItem visibility={{ lg: 'hidden' }}>
        <Tooltip aria="none" aria-live="polite" content={'More options'} flipBehavior={['bottom']}>
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
        </Tooltip>
      </ToolbarItem>
      {cookie.get('cs_toggledRelease') === 'true' ? (
        <HeaderAlert
          className="chr-c-alert-preview"
          title={`Preview has been ${isBeta() ? 'enabled' : 'disabled'}.`}
          variant={AlertVariant.info}
          actionLinks={
            <React.Fragment>
              <AlertActionLink
                component="a"
                href="https://access.redhat.com/support/policy/updates/hybridcloud-console/lifecycle"
                target="_blank"
                rel="noreferrer"
                title="Learn more link"
              >
                Learn more
              </AlertActionLink>
              <AlertActionLink
                onClick={() => {
                  window.location.href = switchRelease(isBeta(), location.pathname, previewEnabled);
                }}
              >
                {`${isBeta() ? 'Disable' : 'Enable'} preview`}
              </AlertActionLink>
            </React.Fragment>
          }
          onDismiss={() => cookie.set('cs_toggledRelease', 'false')}
        />
      ) : null}
    </>
  );
};

export default memo(Tools);
