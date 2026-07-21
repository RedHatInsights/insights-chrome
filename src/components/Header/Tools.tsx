import React, { Fragment, memo, useContext, useEffect, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { DropdownItem } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { ToolbarItem } from '@patternfly/react-core/dist/dynamic/components/Toolbar';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import { ToggleGroup } from '@patternfly/react-core/dist/dynamic/components/ToggleGroup';
import { ToggleGroupItem } from '@patternfly/react-core/dist/dynamic/components/ToggleGroup';
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
import { isPreviewAtom, layoutForceFeltThemeAtom, layoutForceGlassThemeAtom, togglePreviewWithCheckAtom } from '../../state/atoms/releaseAtom';
import { notificationDrawerExpandedAtom } from '../../state/atoms/notificationDrawerAtom';
import useSupportCaseData from '../../hooks/useSupportCaseData';
import { ScalprumComponent, ScalprumComponentProps } from '@scalprum/react-core';
import { drawerPanelContentAtom } from '../../state/atoms/drawerPanelContentAtom';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import UsersIcon from '@patternfly/react-icons/dist/dynamic/icons/users-icon';
import InternalChromeContext from '../../utils/internalChromeContext';
import { ThemeVariants, useTheme } from '../../hooks/useTheme';
import { useGlassTheme } from '../../hooks/useGlassTheme';
import { useFeltTheme } from '../../hooks/useFeltTheme';
import { HighContrastVariants, useHighContrast } from '../../hooks/useHighContrast';
import type { ToolbarConfig } from './Header';
import './Tools.scss';

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

const Tools = ({ toolbarConfig }: { toolbarConfig?: ToolbarConfig }) => {
  const [{ isDemoAcc, isInternal, isRhosakEntitled }, setState] = useState({
    isInternal: true,
    isRhosakEntitled: false,
    isDemoAcc: false,
  });
  const isPreview = useAtomValue(isPreviewAtom);
  const togglePreviewWithCheck = useSetAtom(togglePreviewWithCheckAtom);
  const enableIntegrations = useFlag('platform.sources.integrations');
  const workspacesEnabled = useFlag('platform.rbac.workspaces');
  const helpPanelEnabled = useFlag('platform.chrome.help-panel');
  const askRedHatEnabled = useFlag('platform.chrome.ask-redhat-help');
  const enableGlobalLearningResourcesPage = useFlag('platform.learning-resources.global-learning-resources');
  const isITLessEnv = useFlag('platform.chrome.itless');
  const isDarkModeEnabled = useFlag('platform.chrome.dark-mode');
  const isDarkModeSystemEnabled = useFlag('platform.chrome.dark-mode_system');
  const isGlassForced = useAtomValue(layoutForceGlassThemeAtom);
  const isFeltForced = useAtomValue(layoutForceFeltThemeAtom);
  const isGlassModeEnabled = useFlag('platform.chrome.glass-theme');
  const isHighContrastEnabled = useFlag('platform.chrome.high-contrast');
  const { user, token } = useContext(ChromeAuthContext);
  const intl = useIntl();
  const isOrgAdmin = user?.identity?.user?.is_org_admin;
  const settingsPath = isITLessEnv ? `/settings/my-user-access` : enableIntegrations ? `/settings/integrations` : '/settings/sources';
  const identityAndAccessManagmentPath = isOrgAdmin ? (workspacesEnabled ? '/iam/overview' : '/iam/user-access/overview') : '/iam/my-user-access';
  const betaSwitcherTitle = `${isPreview ? intl.formatMessage(messages.stopUsing) : intl.formatMessage(messages.use)} ${intl.formatMessage(
    messages.betaRelease
  )}`;
  const { themeMode, setLightMode, setDarkMode, setSystemMode } = useTheme();
  const { contrastMode, setDefaultContrast, setHighContrast, setSystemContrast } = useHighContrast();
  const schedulerDrawerEnabled = useFlag('console.chrome-scheduler_drawer');

  const {
    drawerActions: { toggleDrawerContent },
  } = useContext(InternalChromeContext);
  const { isGlassTheme, enableGlass, disableGlass } = useGlassTheme(isGlassModeEnabled, isGlassForced);
  const isFeltThemeEnabled = useFlag('platform.chrome.felt-theme');
  const { isFeltTheme, setFeltEnabled, setFeltDisabled } = useFeltTheme(isFeltForced);

  /* Contrast mode handlers — coordinate glass + high-contrast hooks */
  const handleContrastSystem = () => {
    if (isGlassForced) return;
    disableGlass();
    setSystemContrast();
  };
  const handleContrastDefault = () => {
    if (isGlassForced) return;
    disableGlass();
    setDefaultContrast();
  };
  const handleContrastHigh = () => {
    if (isGlassForced) return;
    disableGlass();
    setHighContrast();
  };
  const handleContrastGlass = () => {
    setDefaultContrast();
    enableGlass();
  };

  /* list out the items for the settings menu */
  const settingsMenuDropdownGroups = [
    {
      items: [
        {
          ouiaId: 'PreviewSwitcher',
          title: `${isPreview ? 'Exit' : 'Enable'} "Preview" mode`,
          onClick: () => togglePreviewWithCheck(),
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          ouiaId: 'settings-menu-integrations',
          url: '/settings/integrations',
          title: 'Integrations',
          isHidden: isITLessEnv,
        },
        {
          ouiaId: 'settings-menu-notifications',
          url: '/settings/notifications',
          title: 'Notifications',
        },
        {
          ouiaId: 'settings-menu-scheduler',
          title: 'Scheduler',
          isHidden: !schedulerDrawerEnabled,
          onClick: () =>
            toggleDrawerContent({
              scope: 'schedulerUi',
              module: './SchedulerPanelContent',
            }),
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
          description: workspacesEnabled ? (
            <Label status="custom" color="teal" variant="outline" icon={<UsersIcon />} isCompact>
              Workspaces model available
            </Label>
          ) : null,
        },
        {
          ouiaId: 'settings-menu-identity-provider',
          url: '/iam/authentication-policy/identity-provider-integration',
          title: 'Identity Provider Integration',
          isHidden: isITLessEnv,
        },
        {
          ouiaId: 'settings-menu-auth-factors',
          url: '/iam/authentication-policy/authentication-factors',
          title: 'Authentication Factors',
          isHidden: isITLessEnv,
        },
        {
          ouiaId: 'settings-menu-service-accounts',
          url: '/iam/service-accounts',
          title: 'Service Accounts',
          isHidden: isITLessEnv,
        },
      ],
    },
    {
      title: intl.formatMessage(messages.theme),
      isHidden: !isFeltThemeEnabled,
      customContent: (
        <ToggleGroup aria-label={intl.formatMessage(messages.theme)} className="pf-v6-u-mx-md pf-v6-u-my-sm">
          <ToggleGroupItem
            text={intl.formatMessage(messages.themeDefault)}
            buttonId="theme-default"
            isSelected={!isFeltTheme}
            onChange={setFeltDisabled}
            aria-label={intl.formatMessage(messages.themeDefault)}
            isDisabled={isFeltForced}
          />
          <ToggleGroupItem
            text={intl.formatMessage(messages.themeFelt)}
            buttonId="theme-felt"
            isSelected={isFeltTheme}
            onChange={setFeltEnabled}
            aria-label={intl.formatMessage(messages.themeFelt)}
          />
        </ToggleGroup>
      ),
    },
    {
      title: intl.formatMessage(messages.colorScheme),
      isHidden: !isDarkModeEnabled,
      customContent: (
        <ToggleGroup aria-label={intl.formatMessage(messages.colorScheme)} className="pf-v6-u-mx-md pf-v6-u-my-sm">
          {isDarkModeSystemEnabled && (
            <ToggleGroupItem
              text={intl.formatMessage(messages.colorSchemeSystem)}
              buttonId="color-scheme-system"
              isSelected={themeMode === ThemeVariants.system}
              onChange={setSystemMode}
              aria-label={intl.formatMessage(messages.colorSchemeSystem)}
            />
          )}
          <ToggleGroupItem
            text={intl.formatMessage(messages.colorSchemeLight)}
            buttonId="color-scheme-light"
            isSelected={themeMode === ThemeVariants.light}
            onChange={setLightMode}
            aria-label={intl.formatMessage(messages.colorSchemeLight)}
          />
          <ToggleGroupItem
            text={intl.formatMessage(messages.colorSchemeDark)}
            buttonId="color-scheme-dark"
            isSelected={themeMode === ThemeVariants.dark}
            onChange={setDarkMode}
            aria-label={intl.formatMessage(messages.colorSchemeDark)}
          />
        </ToggleGroup>
      ),
    },
    {
      title: intl.formatMessage(messages.contrastMode),
      isHidden: !isHighContrastEnabled && !isGlassModeEnabled,
      customContent: (
        <ToggleGroup aria-label={intl.formatMessage(messages.contrastMode)} className="pf-v6-u-mx-md pf-v6-u-my-sm">
          <ToggleGroupItem
            text={intl.formatMessage(messages.contrastSystem)}
            buttonId="contrast-system"
            isSelected={!isGlassTheme && contrastMode === HighContrastVariants.system}
            onChange={handleContrastSystem}
            aria-label={intl.formatMessage(messages.contrastSystem)}
            isDisabled={isGlassForced}
          />
          <ToggleGroupItem
            text={intl.formatMessage(messages.contrastDefault)}
            buttonId="contrast-default"
            isSelected={!isGlassTheme && contrastMode === HighContrastVariants.default}
            onChange={handleContrastDefault}
            aria-label={intl.formatMessage(messages.contrastDefault)}
            isDisabled={isGlassForced}
          />
          {isHighContrastEnabled && (
            <ToggleGroupItem
              text={intl.formatMessage(messages.contrastHigh)}
              buttonId="contrast-high"
              isSelected={!isGlassTheme && contrastMode === HighContrastVariants.high}
              onChange={handleContrastHigh}
              aria-label={intl.formatMessage(messages.contrastHigh)}
              isDisabled={isGlassForced}
            />
          )}
          {isGlassModeEnabled && (
            <ToggleGroupItem
              text={intl.formatMessage(messages.contrastGlass)}
              buttonId="contrast-glass"
              isSelected={isGlassTheme}
              onChange={handleContrastGlass}
              aria-label={intl.formatMessage(messages.contrastGlass)}
            />
          )}
        </ToggleGroup>
      ),
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
  const settingsMobileItems = toolbarConfig?.hideSettings
    ? []
    : [
        {
          url: settingsPath,
          title: 'Settings',
          target: '_self',
        },
        {
          title: betaSwitcherTitle,
          onClick: () => togglePreviewWithCheck(),
        },
      ];
  const helpMobileItems = helpPanelEnabled || toolbarConfig?.hideHelp ? [] : aboutMenuDropdownItems;

  const mobileDropdownItems = [
    ...(settingsMobileItems.length ? [{ title: 'separator' }, ...settingsMobileItems] : []),
    ...(helpMobileItems.length ? [{ title: 'separator' }, ...helpMobileItems] : []),
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

    const AIExperienceIcon = () => (
      <img
        src="/apps/frontend-assets/technology-icons/rh-ui-icon-ai-experience.svg"
        alt="AI Experience"
        className="pf-v6-c-icon pf-m-lg chr-c-ai-experience-icon"
      />
    );

    return (
      <Tooltip
        aria="none"
        aria-live="polite"
        content={intl.formatMessage(messages.helpPanelTooltip)}
        flipBehavior={['bottom']}
        className="tooltip-inner-help-cy"
      >
        <MenuToggle
          variant="default"
          icon={isPreview ? <AIExperienceIcon /> : <QuestionCircleIcon />}
          id="HelpPanelToggle"
          ouiaId="chrome-help-panel"
          aria-label="Toggle help panel"
          onClick={handleToggle}
          isExpanded={isHelpPanelOpen}
          className="chr-c-toolbar-toggle tooltip-button-help-cy chr-c-help-panel-toggle"
        >
          Help
        </MenuToggle>
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

  const isNotificationsEnabled = useFlag('platform.chrome.notifications-drawer');
  const isNotificationDrawerExpanded = useAtomValue(notificationDrawerExpandedAtom);
  const toggleDrawer = () => {
    toggleDrawerContent({
      scope: 'notifications',
      module: './DrawerPanel',
    });
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
      {isNotificationsEnabled && !toolbarConfig?.hideNotifications && <ScalprumComponent {...drawerBellProps} />}
      {isInternal && !ITLess() && (
        <ToolbarItem className="pf-v6-u-mr-0">
          <Tooltip aria="none" aria-live="polite" content={'Internal'} flipBehavior={['bottom']}>
            <InternalButton />
          </Tooltip>
        </ToolbarItem>
      )}
      {!toolbarConfig?.hideSettings && (
        <ToolbarItem className="pf-v6-u-mr-0" visibility={{ default: 'hidden', md: 'visible' }}>
          <ExpandedSettingsButton settingsMenuDropdownGroups={settingsMenuDropdownGroups} />
        </ToolbarItem>
      )}
      {!toolbarConfig?.hideHelp && (
        <ToolbarItem className="pf-v6-u-mr-0" visibility={{ default: 'hidden', md: 'visible' }}>
          {helpPanelEnabled ? <HelpPanelToggleButton /> : <AboutButton />}
        </ToolbarItem>
      )}
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
