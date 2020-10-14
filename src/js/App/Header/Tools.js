import React, { useState, useEffect } from 'react';
import { Button } from '@patternfly/react-core/dist/js/components/Button/Button';
import { DropdownItem } from '@patternfly/react-core/dist/js/components/Dropdown/DropdownItem';
import { PageHeaderTools } from '@patternfly/react-core/dist/js/components/Page/PageHeaderTools';
import { PageHeaderToolsGroup } from '@patternfly/react-core/dist/js/components/Page/PageHeaderToolsGroup';
import { PageHeaderToolsItem } from '@patternfly/react-core/dist/js/components/Page/PageHeaderToolsItem';
import { Divider } from '@patternfly/react-core/dist/js/components/Divider/Divider';
import QuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/question-circle-icon';
import CogIcon from '@patternfly/react-icons/dist/js/icons/cog-icon';
import UserToggle from './UserToggle';
import ToolbarToggle from './ToolbarToggle';
import InsightsAbout from './InsightsAbout';

const Tools = () => {
  {
    /* Set the state */
  }
  const [isSettingsDisabled, setIsSettingsDisabled] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  {
    /* Disable settings/cog icon when a user doesn't have an account number */
  }
  useEffect(() => {
    window.insights.chrome.auth.getUser().then((user) => user.identity.account_number && setIsSettingsDisabled(false));
  }, []);

  {
    /* button that should redirect a user to RBAC with an account */
  }
  const SettingsButton = () => (
    <Button
      variant="plain"
      aria-label="Go to settings"
      widget-type="SettingsButton"
      className="ins-c-toolbar__button-settings"
      href={`${document.baseURI}settings/my-user-access`}
      component="a"
    >
      <CogIcon />
    </Button>
  );

  {
    /* list out the items for the about menu */
  }
  const aboutMenuDropdownItems = [
    {
      title: 'Get support',
      url: 'https://access.redhat.com/support',
    },
    {
      title: 'Open support case',
      onClick: () => window.insights.chrome.createCase(),
    },
    {
      title: 'Training',
      url: 'https://www.redhat.com/en/services/training-and-certification',
    },
    {
      title: 'API documentation',
      url: `${document.baseURI}docs/api`,
    },
    {
      title: 'About',
      onClick: () => setIsModalOpen(true),
    },
  ];

  {
    /* Combine aboutMenuItems with a settings link on mobile */
  }
  const mobileDropdownItems = [
    { title: 'separator' },
    {
      title: 'Settings',
      url: `${document.baseURI}settings/my-user-access`,
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
      className="ins-c-toolbar__menu-help"
      hasToggleIndicator={null}
      widget-type="HelpMenu"
      dropdownItems={aboutMenuDropdownItems}
    />
  );

  return (
    <PageHeaderTools widget-type="InsightsToolbar">
      {/* Show tools on medium and above screens */}
      <PageHeaderToolsGroup visibility={{ default: 'hidden', sm: 'visible' }}>
        {!isSettingsDisabled && (
          <PageHeaderToolsItem isSelected={window.insights.chrome.getBundle() === 'settings'}>{<SettingsButton />}</PageHeaderToolsItem>
        )}
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

      {/* Render About Modal */}
      {isModalOpen && <InsightsAbout isModalOpen={isModalOpen} onClose={() => setIsModalOpen(!isModalOpen)} />}
    </PageHeaderTools>
  );
};

export default Tools;
