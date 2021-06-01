import React, { memo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
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
import { Flex } from '@patternfly/react-core/dist/js/layouts/Flex/Flex';
import { Badge } from '@patternfly/react-core/dist/js/components/Badge/Badge';
import HeaderAlert from './HeaderAlert';
import cookie from 'js-cookie';
import './Tools.scss';
import { isBeta } from '../../utils';
import { spinUpStore } from '../../redux-config';
import classnames from 'classnames';

export const switchRelease = (isBeta, pathname) => {
  cookie.set('cs_toggledRelease', 'true');
  const { store } = spinUpStore();
  const isAppOnlyOnBeta = store.getState().chrome.activeSection?.isBeta;

  if (isBeta) {
    return isAppOnlyOnBeta ? window.location.origin : `${document.baseURI.replace(/\/*beta/, '')}${pathname.replace(/\/*beta\/*/, '')}`;
  } else {
    let path = pathname.split('/');
    path[0] = 'beta';
    return document.baseURI.concat(path.join('/'));
  }
};

export const betaBadge = (css) => <Badge className={classnames('ins-c-toolbar__beta-badge', css)}>beta</Badge>;

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

const SettingsButton = ({ settingsMenuDropdownItems }) => (
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

SettingsButton.propTypes = {
  settingsMenuDropdownItems: PropTypes.array.isRequired,
};

const settingsPath = `${document.baseURI}settings/my-user-access`;
const betaSwitcherTitle = `${isBeta() ? 'Stop using' : 'Use'} the beta release`;
/* list out the items for the settings menu */
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

const Tools = () => {
  const [{ isDemoAcc, isInternal, isSettingsDisabled }, setState] = useState({
    isSettingsDisabled: true,
    isInternal: true,
    isDemoAcc: false,
  });

  useEffect(() => {
    window.insights.chrome.auth.getUser().then((user) => {
      /* Disable settings/cog icon when a user doesn't have an account number */
      setState({
        isSettingsDisabled: !user?.identity?.account_number,
        isInternal: !!user?.identity?.user?.is_internal,
        isDemoAcc: user?.identity?.user?.username === 'insights-demo-2021',
      });
    });
  }, []);

  /* list out the items for the about menu */
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
      title: 'Demo mode',
      onClick: () => cookie.set('cs_demo', 'true') && location.reload(),
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
      onClick: () => (window.location = switchRelease(isBeta(), window.location.pathname)),
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
      className="ins-c-toolbar__menu-help"
      hasToggleIndicator={null}
      dropdownItems={aboutMenuDropdownItems}
    />
  );

  return (
    <PageHeaderTools widget-type="InsightsToolbar">
      {/* Show tools on medium and above screens */}
      <PageHeaderToolsGroup visibility={{ default: 'hidden', lg: 'visible' }}>
        {isInternal && !window.insights.chrome.isProd && (
          <PageHeaderToolsItem isSelected={window.insights.chrome.getBundle() === 'internal'}>{<InternalButton />}</PageHeaderToolsItem>
        )}
        {!isSettingsDisabled && <PageHeaderToolsItem>{<SettingsButton settingsMenuDropdownItems={settingsMenuDropdownItems} />}</PageHeaderToolsItem>}
        <PageHeaderToolsItem>{<AboutButton />}</PageHeaderToolsItem>
      </PageHeaderToolsGroup>

      {/* Show full user dropdown on medium and above screens */}
      <PageHeaderToolsGroup visibility={{ default: 'hidden', lg: 'visible' }}>
        <PageHeaderToolsItem>
          <UserToggle className="ins-c-dropdown__user" />
        </PageHeaderToolsItem>
      </PageHeaderToolsGroup>

      {/* Collapse tools and user dropdown to kebab on small screens  */}
      <PageHeaderToolsGroup visibility={{ lg: 'hidden' }}>
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
    </PageHeaderTools>
  );
};

export default memo(Tools);
