/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { memo, useContext, useEffect, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { DropdownItem } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { NotificationBadge } from '@patternfly/react-core/dist/dynamic/components/NotificationBadge';
import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';
import { ToolbarItem } from '@patternfly/react-core/dist/dynamic/components/Toolbar';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import QuestionCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/question-circle-icon';
import CogIcon from '@patternfly/react-icons/dist/dynamic/icons/cog-icon';
import RedhatIcon from '@patternfly/react-icons/dist/dynamic/icons/redhat-icon';
import UserToggle from './UserToggle';
import ToolbarToggle from './ToolbarToggle';
import SettingsToggle, { SettingsToggleDropdownGroup } from './SettingsToggle';
import cookie from 'js-cookie';
import { ITLess, getSection } from '../../utils/common';
import { useIntl } from 'react-intl';
import { useFlag } from '@unleash/proxy-client-react';
import messages from '../../locales/Messages';
import { createSupportCase } from '../../utils/createCase';
import BellIcon from '@patternfly/react-icons/dist/dynamic/icons/bell-icon';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { isPreviewAtom, togglePreviewWithCheckAtom } from '../../state/atoms/releaseAtom';
import { notificationDrawerExpandedAtom, unreadNotificationsAtom } from '../../state/atoms/notificationDrawerAtom';
import useSupportCaseData from '../../hooks/useSupportCaseData';

const isITLessEnv = ITLess();

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

type ExpandedSettingsButtonProps = {
  settingsMenuDropdownGroups: SettingsToggleDropdownGroup[];
};

const ExpandedSettingsButton = ({ settingsMenuDropdownGroups }: ExpandedSettingsButtonProps) => (
  <Tooltip aria="none" aria-live="polite" content={'Settings'} flipBehavior={['bottom']} className="tooltip-inner-settings-cy">
    <SettingsToggle
      key="Settings menu"
      icon={() => <CogIcon />}
      id="SettingsMenu"
      ariaLabel="Settings menu"
      ouiaId="chrome-settings"
      hasToggleIndicator={null}
      widget-type="SettingsMenu"
      dropdownItems={settingsMenuDropdownGroups}
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
  const isPreview = useAtomValue(isPreviewAtom);
  const togglePreviewWithCheck = useSetAtom(togglePreviewWithCheckAtom);
  const enableIntegrations = useFlag('platform.sources.integrations');
  const workspacesEnabled = useFlag('platform.rbac.workspaces');
  const enableGlobalLearningResourcesPage = useFlag('platform.learning-resources.global-learning-resources');
  const { user, token } = useContext(ChromeAuthContext);
  const unreadNotifications = useAtomValue(unreadNotificationsAtom);
  const [isNotificationDrawerExpanded, toggleNotifications] = useAtom(notificationDrawerExpandedAtom);
  const intl = useIntl();
  const isOrgAdmin = user?.identity?.user?.is_org_admin;
  const settingsPath = isITLessEnv ? `/settings/my-user-access` : enableIntegrations ? `/settings/integrations` : '/settings/sources';
  const identityAndAccessManagmentPath = isOrgAdmin
    ? `/iam/${workspacesEnabled ? 'access-management' : 'user-access'}/overview`
    : '/iam/my-user-access';
  const betaSwitcherTitle = `${isPreview ? intl.formatMessage(messages.stopUsing) : intl.formatMessage(messages.use)} ${intl.formatMessage(
    messages.betaRelease
  )}`;

  const isNotificationsEnabled = useFlag('platform.chrome.notifications-drawer');

  /* list out the items for the settings menu */
  const settingsMenuDropdownGroups = [
    {
      items: [
        {
          ouiaId: 'PreviewSwitcher',
          title: `${isPreview ? 'Exit' : 'Enable'} "Preview" mode`,
          url: '#',
          onClick: () => togglePreviewWithCheck(),
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          url: '/settings/integrations',
          title: 'Integrations',
        },
        {
          url: '/settings/notifications',
          title: 'Notifications',
        },
      ],
    },
    {
      title: 'Identity and Access Management',
      items: [
        {
          url: identityAndAccessManagmentPath,
          title: isOrgAdmin ? (workspacesEnabled ? 'Acess management' : 'User Access') : 'My User Access',
        },
        {
          url: '/iam/authentication-policy/authentication-factors',
          title: 'Authentication Policy',
        },
        {
          url: '/iam/service-accounts',
          title: 'Service Accounts',
        },
      ],
    },
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
  const supportCaseData = useSupportCaseData();

  const supportOptionsUrl = () => {
    return isITLessEnv ? 'https://redhatgov.servicenowservices.com/css' : 'https://access.redhat.com/support';
  };

  /* list out the items for the about menu */
  const aboutMenuDropdownItems = [
    {
      title: intl.formatMessage(messages.apiDocumentation),
      onClick: () => window.open('https://developers.redhat.com/api-catalog/', '_blank'),
      isHidden: isITLessEnv,
    },
    {
      title: intl.formatMessage(messages.openSupportCase),
      onClick: () => createSupportCase(user.identity, token, isPreview, { supportCaseData }),
      isDisabled: window.location.href.includes('/application-services') && !isRhosakEntitled,
      isHidden: isITLessEnv,
    },
    {
      title: intl.formatMessage(messages.statusPage),
      onClick: () => window.open('https://status.redhat.com/', '_blank'),
      isHidden: isITLessEnv,
    },
    {
      title: intl.formatMessage(messages.supportOptions),
      onClick: () => (window.location.href = supportOptionsUrl()),
    },
    {
      title: intl.formatMessage(messages.insightsRhelDocumentation),
      onClick: () => window.open('https://docs.redhat.com/en/documentation/red_hat_insights', '_blank'),
      isHidden: getSection() !== 'insights' || isITLessEnv,
    },
    {
      title: intl.formatMessage(messages.demoMode),
      onClick: () => cookie.set('cs_demo', 'true') && window.location.reload(),
      isHidden: !isDemoAcc,
    },
    ...(enableGlobalLearningResourcesPage
      ? [
          {
            title: intl.formatMessage(messages.globalLearningResourcesPage),
            onClick: () => window.open('/staging/global-learning-resources-page', '_blank'),
          },
        ]
      : []),
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
      onClick: () => togglePreviewWithCheck(),
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
      {isNotificationsEnabled && (
        <ToolbarItem className="pf-v5-u-mx-0">
          <Tooltip aria="none" aria-live="polite" content={'Notifications'} flipBehavior={['bottom']} className="tooltip-inner-settings-cy">
            <NotificationBadge
              className="chr-c-notification-badge"
              variant={unreadNotifications ? 'unread' : 'read'}
              onClick={() => toggleNotifications((prev) => !prev)}
              aria-label="Notifications"
              isExpanded={isNotificationDrawerExpanded}
            >
              <BellIcon />
            </NotificationBadge>
          </Tooltip>
        </ToolbarItem>
      )}
      {localStorage.getItem('chrome:darkmode') === 'true' && (
        <ToolbarItem>
          <ThemeToggle />
        </ToolbarItem>
      )}
      {isInternal && !ITLess() && (
        <ToolbarItem className="pf-v5-u-mr-0">
          <Tooltip aria="none" aria-live="polite" content={'Internal'} flipBehavior={['bottom']}>
            <InternalButton />
          </Tooltip>
        </ToolbarItem>
      )}
      <ToolbarItem className="pf-v5-u-mr-0" visibility={{ default: 'hidden', md: 'visible' }}>
        <ExpandedSettingsButton settingsMenuDropdownGroups={settingsMenuDropdownGroups} />
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
    </>
  );
};

export default memo(Tools);
