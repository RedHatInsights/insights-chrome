import React, { Fragment, memo, useContext, useEffect, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { DropdownItem } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
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
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { isPreviewAtom, togglePreviewWithCheckAtom } from '../../state/atoms/releaseAtom';
import { notificationDrawerExpandedAtom } from '../../state/atoms/notificationDrawerAtom';
import useSupportCaseData from '../../hooks/useSupportCaseData';
import { ScalprumComponent, ScalprumComponentProps } from '@scalprum/react-core';
import { drawerPanelContentAtom } from '../../state/atoms/drawerPanelContentAtom';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import UsersIcon from '@patternfly/react-icons/dist/dynamic/icons/users-icon';
import InternalChromeContext from '../../utils/internalChromeContext';

const InternalButton = () => (
  <Button
    icon={<RedhatIcon />}
    variant="control"
    aria-label="Go to internal tools"
    widget-type="InternalButton"
    className="chr-c-toolbar__button-internal pf-v6-u-align-items-center"
    href={`${document.baseURI}internal`}
    component="a"
  />
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

type NotificationBellProps = {
  isNotificationDrawerExpanded: boolean;
  toggleDrawer: () => void;
};

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
  const workspacesListEnabled = useFlag('platform.rbac.workspaces-list');
  const helpPanelEnabled = useFlag('platform.chrome.help-panel');
  const askRedHatEnabled = useFlag('platform.chrome.ask-redhat-help');
  const enableGlobalLearningResourcesPage = useFlag('platform.learning-resources.global-learning-resources');
  const isITLessEnv = useFlag('platform.chrome.itless');
  const { user, token } = useContext(ChromeAuthContext);
  const intl = useIntl();
  const isOrgAdmin = user?.identity?.user?.is_org_admin;
  const settingsPath = isITLessEnv ? `/settings/my-user-access` : enableIntegrations ? `/settings/integrations` : '/settings/sources';
  const identityAndAccessManagmentPath = isOrgAdmin ? `/iam/${workspacesEnabled ? 'access-management' : 'user-access'}/overview` : '/iam/my-user-access';
  const betaSwitcherTitle = `${isPreview ? intl.formatMessage(messages.stopUsing) : intl.formatMessage(messages.use)} ${intl.formatMessage(
    messages.betaRelease
  )}`;

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
          isHidden: isITLessEnv,
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
          ouiaId: 'UserAccess',
          url: identityAndAccessManagmentPath,
          title: isOrgAdmin ? (workspacesEnabled ? 'Acess management' : 'User Access') : 'My User Access',
          description:
            workspacesEnabled || workspacesListEnabled ? (
              <Label status="custom" color="teal" variant="outline" icon={<UsersIcon />} isCompact>
                Workspaces model available
              </Label>
            ) : null,
        },
        {
          url: '/iam/authentication-policy/identity-provider-integration',
          title: 'Identity Provider Integration',
          isHidden: isITLessEnv,
        },
        {
          url: '/iam/authentication-policy/authentication-factors',
          title: 'Authentication Factors',
          isHidden: isITLessEnv,
        },
        {
          url: '/iam/service-accounts',
          title: 'Service Accounts',
          isHidden: isITLessEnv,
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

  const {
    drawerActions: { toggleDrawerContent },
  } = useContext(InternalChromeContext);

  /* list out the items for the about menu */
  const aboutMenuItemsConfig = [
    {
      enabled: askRedHatEnabled,
      item: {
        title: intl.formatMessage(messages.askRedHat),
        icon: <img className="pf-v6-c-button__icon" height="26" width="26" src="/apps/frontend-assets/technology-icons/ai-chat-ask-redhat.svg" />,
        onClick: () => window.open('https://access.redhat.com/ask', '_blank'),
      },
    },
    {
      enabled: !helpPanelEnabled,
      item: {
        title: intl.formatMessage(messages.apiDocumentation),
        onClick: () => window.open('https://developers.redhat.com/api-catalog/', '_blank'),
        isHidden: isITLessEnv,
      },
    },
    {
      enabled: !helpPanelEnabled && user?.identity && token,
      item: {
        title: intl.formatMessage(messages.openSupportCase),
        onClick: () => createSupportCase(user.identity, token, isPreview, { supportCaseData }),
        isDisabled: window.location.href.includes('/application-services') && !isRhosakEntitled,
        isHidden: isITLessEnv,
      },
    },
    {
      enabled: true,
      item: {
        title: intl.formatMessage(messages.statusPage),
        onClick: () => window.open('https://status.redhat.com/', '_blank'),
        isHidden: isITLessEnv,
      },
    },
    {
      enabled: true,
      item: {
        title: intl.formatMessage(messages.supportOptions),
        onClick: () => (window.location.href = supportOptionsUrl()),
      },
    },
    {
      enabled: !helpPanelEnabled,
      item: {
        title: intl.formatMessage(messages.insightsRhelDocumentation),
        onClick: () => window.open('https://docs.redhat.com/en/documentation/red_hat_insights', '_blank'),
        isHidden: getSection() !== 'insights' || isITLessEnv,
      },
    },
    {
      enabled: !helpPanelEnabled,
      item: {
        title: intl.formatMessage(messages.demoMode),
        onClick: () => cookie.set('cs_demo', 'true') && window.location.reload(),
        isHidden: !isDemoAcc,
      },
    },
    ...(enableGlobalLearningResourcesPage
      ? [
          {
            enabled: true,
            item: {
              title: intl.formatMessage(messages.globalLearningResourcesPage),
              url: '/learning-resources',
              appId: 'learningResources',
              target: '_self',
            },
          },
        ]
      : []),
  ];
  const aboutMenuDropdownItems = aboutMenuItemsConfig.filter(({ enabled }) => enabled).map(({ item }) => item);

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
    ...(helpPanelEnabled ? [] : aboutMenuDropdownItems),
  ];

  /* Help Panel Toggle Button */
  const HelpPanelToggleButton = () => {
    const isHelpPanelOpen = drawerContent?.scope === 'learningResources' && isNotificationDrawerExpanded;

    const handleToggle = () => {
      toggleDrawerContent({
        scope: 'learningResources',
        module: './HelpPanel',
      });
    };

    return (
      <Tooltip
        aria="none"
        aria-live="polite"
        content={intl.formatMessage(messages.helpPanelTooltip)}
        flipBehavior={['bottom']}
        className="tooltip-inner-help-cy"
      >
        <Button
          variant="control"
          icon={<QuestionCircleIcon />}
          id="HelpPanelToggle"
          ouiaId="chrome-help-panel"
          aria-label="Toggle help panel"
          onClick={handleToggle}
          isClicked={isHelpPanelOpen}
          className="tooltip-button-help-cy"
        >
          Help
        </Button>
      </Tooltip>
    );
  };

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
          if (document.body.classList.contains('pf-theme-dark')) {
            document.body.classList.remove('pf-theme-dark');
          } else {
            document.body.classList.add('pf-theme-dark');
          }
        }}
      />
    );
  };

  const isNotificationsEnabled = useFlag('platform.chrome.notifications-drawer');
  const [isNotificationDrawerExpanded, setIsNotificationsDrawerExpanded] = useAtom(notificationDrawerExpandedAtom);
  const toggleDrawer = () => {
    setIsNotificationsDrawerExpanded((prev) => !prev);
  };
  const drawerContent = useAtomValue(drawerPanelContentAtom);

  const drawerBellProps: ScalprumComponentProps<Record<string, unknown>, NotificationBellProps> = {
    scope: 'notifications',
    module: './NotificationsDrawerBell',
    fallback: null,
    isNotificationDrawerExpanded: drawerContent?.scope === 'notifications' && isNotificationDrawerExpanded,
    // Do not show the error component if module fails to load
    // Prevents broken layout
    ErrorComponent: <Fragment />,
    toggleDrawer,
  };

  return (
    <>
      {isNotificationsEnabled && <ScalprumComponent {...drawerBellProps} />}
      {localStorage.getItem('chrome:darkmode') === 'true' && (
        <ToolbarItem>
          <ThemeToggle />
        </ToolbarItem>
      )}
      {isInternal && !ITLess() && (
        <ToolbarItem className="pf-v6-u-mr-0">
          <Tooltip aria="none" aria-live="polite" content={'Internal'} flipBehavior={['bottom']}>
            <InternalButton />
          </Tooltip>
        </ToolbarItem>
      )}
      <ToolbarItem className="pf-v6-u-mr-0" visibility={{ default: 'hidden', md: 'visible' }}>
        <ExpandedSettingsButton settingsMenuDropdownGroups={settingsMenuDropdownGroups} />
      </ToolbarItem>
      <ToolbarItem className="pf-v6-u-mr-0" visibility={{ default: 'hidden', md: 'visible' }}>
        {helpPanelEnabled ? <HelpPanelToggleButton /> : <AboutButton />}
      </ToolbarItem>
      <ToolbarItem className="pf-v6-u-mr-0" visibility={{ default: 'hidden', lg: 'visible' }}>
        <UserToggle />
      </ToolbarItem>
      {/* Collapse tools and user dropdown to kebab on small screens  */}

      <ToolbarItem visibility={{ lg: 'hidden' }}>
        <Tooltip aria="none" aria-live="polite" content={'More options'} flipBehavior={['bottom']}>
          <UserToggle
            extraItems={mobileDropdownItems.map((action, key) => (
              <React.Fragment key={key}>
                {action.title === 'separator' ? (
                  <Divider component="li" />
                ) : 'onClick' in action ? (
                  <DropdownItem component="button" onClick={action.onClick}>
                    {action.title}
                  </DropdownItem>
                ) : 'url' in action ? (
                  <DropdownItem href={action.url} component="a" target={action.target || '_blank'} rel="noopener noreferrer">
                    {action.title}
                  </DropdownItem>
                ) : null}
              </React.Fragment>
            ))}
          />
        </Tooltip>
      </ToolbarItem>
    </>
  );
};

export default memo(Tools);
