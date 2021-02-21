// TODO: Delete demo stuff later

import React, { useState, useEffect } from 'react';
import { Button } from '@patternfly/react-core/dist/js/components/Button/Button';
import { DropdownItem } from '@patternfly/react-core/dist/js/components/Dropdown/DropdownItem';
import { PageHeaderTools } from '@patternfly/react-core/dist/js/components/Page/PageHeaderTools';
import { PageHeaderToolsGroup } from '@patternfly/react-core/dist/js/components/Page/PageHeaderToolsGroup';
import { PageHeaderToolsItem } from '@patternfly/react-core/dist/js/components/Page/PageHeaderToolsItem';
import { Divider } from '@patternfly/react-core/dist/js/components/Divider/Divider';
import QuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/question-circle-icon';
import CogIcon from '@patternfly/react-icons/dist/js/icons/cog-icon';
import RedhatIcon from '@patternfly/react-icons/dist/js/icons/redhat-icon';
import UserToggle from './UserToggle';
import ToolbarToggle from './ToolbarToggle';
import InsightsAbout from './InsightsAbout';
import { Badge, Flex } from '@patternfly/react-core';
import HeaderAlert from './HeaderAlert';
import cookie from 'js-cookie';
import './Tools.scss';
import { isBeta } from '../../utils';

export const switchRelease = (isBeta, pathname) => {
  cookie.set('cs_toggledRelease', 'true');
  if (isBeta) {
    return `${document.baseURI}${pathname.replace(/\/*beta\/*/, '')}`;
  } else {
    let path = pathname.split('/');
    path[0] = 'beta';
    return document.baseURI.concat(path.join('/'));
  }
};

const Tools = () => {
  {
    /* Set the state */
  }
  const [isSettingsDisabled, setIsSettingsDisabled] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const [isDemoAcc, setIsDemoAcc] = useState(false);
  const settingsPath = `${document.baseURI}settings/my-user-access`;
  const betaSwitcherTitle = `${isBeta() ? 'Stop using' : 'Use'} the beta release`;

  {
    /* Disable settings/cog icon when a user doesn't have an account number */
  }
  useEffect(() => {
    window.insights.chrome.auth.getUser().then((user) => {
      user?.identity?.account_number && setIsSettingsDisabled(false);
      user?.identity?.user?.is_internal && setIsInternal(true);
      user?.identity?.user?.username === 'insights-demo-2021' && setIsDemoAcc(true);
    });
  }, []);

  {
    /* list out the items for the settings menu */
  }
  const settingsMenuDropdownItems = [
    {
      url: settingsPath,
      title: 'Settings',
      target: '_self',
    },
    {
      title: betaSwitcherTitle,
      onClick: () => (window.location = switchRelease(isBeta(), window.location.pathname)),
    },
  ];

  {
    /* button that should redirect a user to RBAC with an account */
  }
  const SettingsButton = () => (
    <ToolbarToggle
      key="Settings menu"
      icon={() => (
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          {isBeta() ? <Badge className="ins-c-toolbar__beta-badge">beta</Badge> : null}
          <CogIcon />
        </Flex>
      )}
      id="SettingsMenu"
      ouiaId="chrome-settings"
      hasToggleIndicator={null}
      widget-type="SettingsMenu"
      dropdownItems={settingsMenuDropdownItems}
    />
  );

  {
    /* button that should redirect a user to internal bundle if internal employee*/
  }
  const InternalButton = () => (
    <Button
      variant="plain"
      aria-label="Go to internal tools"
      widget-type="InternalButton"
      className="ins-c-toolbar__button-internal"
      href={`${document.baseURI}internal`}
      component="a"
    >
      <RedhatIcon />
    </Button>
  );

  {
    /* list out the items for the about menu */
  }
  const aboutMenuDropdownItems = [
    {
      title: 'Support options',
      url: 'https://access.redhat.com/support',
    },
    {
      title: 'Open support case',
      onClick: () => window.insights.chrome.createCase(),
    },
    {
      title: 'API documentation',
      url: `${document.baseURI}docs/api`,
    },
    {
      title: 'About',
      onClick: () => setIsModalOpen(true),
    },
    {
      title: 'Demo mode',
      onClick: () => cookie.set('cs_demo', 'true') && location.reload(),
      isHidden: !isDemoAcc,
    },
  ];

  {
    /* Combine aboutMenuItems with a settings link on mobile */
  }
  const mobileDropdownItems = [
    { title: 'separator' },
    {
      url: settingsPath,
      title: 'Settings',
      target: '_self',
    },
    {
      title: betaSwitcherTitle,
      onClick: () => (window.location = switchRelease(isBeta(), window.location.pathname)),
    },
    { title: 'separator' },
    ...aboutMenuDropdownItems,
  ];

  {
    /* QuestionMark icon that should be used for "help/support" things */
  }
  const AboutButton = () => (
    <ToolbarToggle
      key="Help menu"
      icon={QuestionCircleIcon}
      id="HelpMenu"
      ouiaId="chrome-help"
      className="ins-c-toolbar__menu-help"
      hasToggleIndicator={null}
      dropdownItems={aboutMenuDropdownItems}
    />
  );

  return (
    <PageHeaderTools widget-type="InsightsToolbar">
      {/* Show tools on medium and above screens */}
      <PageHeaderToolsGroup visibility={{ default: 'hidden', sm: 'visible' }}>
        {isInternal && !window.insights.chrome.isProd && (
          <PageHeaderToolsItem isSelected={window.insights.chrome.getBundle() === 'internal'}>{<InternalButton />}</PageHeaderToolsItem>
        )}
        {!isSettingsDisabled && <PageHeaderToolsItem>{<SettingsButton />}</PageHeaderToolsItem>}
        <PageHeaderToolsItem>{<AboutButton />}</PageHeaderToolsItem>
      </PageHeaderToolsGroup>

      {/* Show full user dropdown on medium and above screens */}
      <PageHeaderToolsGroup visibility={{ default: 'hidden', sm: 'visible' }}>
        <PageHeaderToolsItem>
          <UserToggle className="ins-c-dropdown__user" />
        </PageHeaderToolsItem>
      </PageHeaderToolsGroup>

      {/* Collapse tools and user dropdown to kebab on small screens  */}
      <PageHeaderToolsGroup visibility={{ sm: 'hidden' }}>
        <PageHeaderToolsItem>
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
        </PageHeaderToolsItem>
      </PageHeaderToolsGroup>

      {cookie.get('cs_toggledRelease') === 'true' ? (
        <HeaderAlert
          title={`You're ${isBeta() ? 'now' : 'no longer'} using the beta release.`}
          onDismiss={() => cookie.set('cs_toggledRelease', 'false')}
        />
      ) : null}

      {/* Render About Modal */}
      {isModalOpen && <InsightsAbout isModalOpen={isModalOpen} onClose={() => setIsModalOpen(!isModalOpen)} />}
    </PageHeaderTools>
  );
};

export default Tools;
