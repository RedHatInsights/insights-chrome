import React, { memo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Button, Divider, DropdownItem, ToolbarItem } from '@patternfly/react-core';
import QuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/question-circle-icon';
import CogIcon from '@patternfly/react-icons/dist/js/icons/cog-icon';
import RedhatIcon from '@patternfly/react-icons/dist/js/icons/redhat-icon';
import UserToggle from './UserToggle';
import ToolbarToggle from './ToolbarToggle';
import HeaderAlert from './HeaderAlert';
import cookie from 'js-cookie';
import { getUrl, isBeta } from '../../utils';
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
      <>
        {isBeta() ? <Badge className="chr-c-badge-beta">beta</Badge> : null}
        <CogIcon />
      </>
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

const bundle = getUrl('bundle');
const settingsPath = `/settings/my-user-access${bundle ? `?bundle=${bundle}` : ''}`;
const betaSwitcherTitle = `${isBeta() ? 'Stop using' : 'Use'} the beta release`;
/* list out the items for the settings menu */
const settingsMenuDropdownItems = [
  {
    url: settingsPath,
    title: 'Settings',
    target: '_self',
    appId: 'rbac',
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
      url: `/docs/api`,
      appId: 'apiDocs',
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
    <div widget-type="InsightsToolbar">
      <ToolbarItem>
        {isInternal && !window.insights.chrome.isProd && (
          <div>{<InternalButton />}</div>
        )}
        {!isSettingsDisabled && <div>{<SettingsButton settingsMenuDropdownItems={settingsMenuDropdownItems} />}</div>}
        {<AboutButton />}

        <ToolbarItem visibility={{ default: 'hidden', lg: 'visible' }}>
          <UserToggle className="ins-c-dropdown__user" />
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
      </ToolbarItem>
      {cookie.get('cs_toggledRelease') === 'true' ? (
        <HeaderAlert
          title={`You're ${isBeta() ? 'now' : 'no longer'} using the beta release.`}
          onDismiss={() => cookie.set('cs_toggledRelease', 'false')}
        />
      ) : null}
    </div>
  );
};

export default memo(Tools);
